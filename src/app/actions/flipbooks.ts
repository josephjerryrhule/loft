"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";
import { canUseCustomerLibrary, canUseParentLibraryForChild } from "@/lib/access-control.mjs";
import { processPdf, PdfProcessorError } from "@/lib/pdf-processor";
import { uploadBuffer, deleteFlipbookAssets } from "@/lib/upload";
import { categorySlugForAgeGroup } from "@/lib/age-group-category";

const MAX_SOURCE_PDF_MB = 50;

async function assertAdminOrOpsForFlipbook() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
    throw new Error("Unauthorized");
  }
  return session!.user!.id;
}

const flipbookSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  heyzineUrl: z.string().url("Must be a valid URL"),
  ageGroup: z.string().optional().nullable(),
  isFree: z.boolean().optional(),
  schedulePublish: z.boolean().optional(),
  publishedAt: z.string().optional().nullable(),
});

async function fetchHeyzineData(url: string) {
  try {
    const response = await fetch(`https://heyzine.com/api1/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (!response.ok) {
        throw new Error(`Failed to fetch oEmbed data: ${response.statusText}`);
    }
    const data = await response.json();
    return {
        iframeContent: data.html,
        thumbnailUrl: data.thumbnail_url,
    };
  } catch (error) {
    console.error("Error fetching Heyzine data:", error);
    throw new Error("Failed to fetch flipbook data from Heyzine. Please check the URL.");
  }
}

type CreateFlipbookInput =
  | {
      sourceType: "HEYZINE";
      title: string;
      description?: string;
      ageGroup?: string | null;
      isFree?: boolean;
      coverImageUrl?: string | null;
      heyzineUrl?: string | null;
      iframeContent?: string | null;
    }
  | {
      sourceType: "SELF_HOSTED";
      title: string;
      description?: string;
      ageGroup?: string | null;
      isFree?: boolean;
      coverImageUrl?: string | null;
      pdfFile: { name: string; type: string; size: number; arrayBuffer(): Promise<ArrayBuffer> };
    };

export async function createFlipbook(input: CreateFlipbookInput) {
  try {
    const userId = await assertAdminOrOpsForFlipbook();

    // Auto-derive categoryId from ageGroup (single lookup, used by both branches)
    const slug = categorySlugForAgeGroup(input.ageGroup);
    const cat = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
    const derivedCategoryId = cat?.id ?? null;

    if (input.sourceType === "HEYZINE") {
      const fb = await prisma.flipbook.create({
        data: {
          title: input.title,
          description: input.description,
          categoryId: derivedCategoryId,
          ageGroup: input.ageGroup ?? null,
          isFree: input.isFree ?? false,
          coverImageUrl: input.coverImageUrl ?? null,
          heyzineUrl: input.heyzineUrl ?? null,
          iframeContent: input.iframeContent ?? null,
          sourceType: "HEYZINE",
          createdById: userId,
        },
      });
      revalidatePath("/admin/flipbooks");
      return { success: true, id: fb.id };
    }

    // SELF_HOSTED path
    const sizeMb = input.pdfFile.size / (1024 * 1024);
    if (sizeMb > MAX_SOURCE_PDF_MB) {
      return { error: `PDF too large (${sizeMb.toFixed(1)} MB). Max ${MAX_SOURCE_PDF_MB} MB.` };
    }
    if (input.pdfFile.type !== "application/pdf") {
      return { error: "Only PDF files are accepted" };
    }

    const created = await prisma.flipbook.create({
      data: {
        title: input.title,
        description: input.description,
        categoryId: derivedCategoryId,
        ageGroup: input.ageGroup ?? null,
        isFree: input.isFree ?? false,
        coverImageUrl: input.coverImageUrl ?? null,
        sourceType: "SELF_HOSTED",
        createdById: userId,
        processingStartedAt: new Date(),
      },
    });

    try {
      const ab = await input.pdfFile.arrayBuffer();
      const buf = Buffer.from(ab);
      const result = await processPdf(buf);

      const folder = `flipbooks/${created.id}`;
      const sourceUrl = await uploadBuffer(buf, "application/pdf", folder, "source.pdf");
      // optimizedPdf is currently a passthrough of the source (no system compressor).
      // Skip the extra write to avoid storing the same bytes twice.
      const optimizedUrl = sourceUrl;

      const pages = [];
      for (let i = 0; i < result.pages.length; i++) {
        const name = `page-${String(i + 1).padStart(3, "0")}.webp`;
        const url = await uploadBuffer(result.pages[i].buffer, "image/webp", folder, name);
        pages.push({ url, width: result.pages[i].width, height: result.pages[i].height });
      }

      const manifest = {
        totalPages: result.totalPages,
        pages,
        generatedAt: new Date().toISOString(),
      };

      await prisma.flipbook.update({
        where: { id: created.id },
        data: {
          pdfUrl: sourceUrl,
          optimizedPdfUrl: optimizedUrl,
          pagesManifest: manifest as any,
          totalPages: result.totalPages,
          coverImageUrl: input.coverImageUrl ?? pages[0]?.url ?? null,
          processingStartedAt: null,
        },
      });

      revalidatePath("/admin/flipbooks");
      return { success: true, id: created.id };
    } catch (e: any) {
      // Roll back DB row + wipe any partial assets
      await deleteFlipbookAssets(created.id).catch(() => {});
      await prisma.flipbook.delete({ where: { id: created.id } }).catch(() => {});
      const msg =
        e instanceof PdfProcessorError ? e.message : e?.message ?? "PDF processing failed";
      return { error: msg };
    }
  } catch (e: any) {
    if (e.message === "Unauthorized") return { error: "Unauthorized" };
    console.error("createFlipbook failed", e);
    return { error: "Failed to create flipbook" };
  }
}

export async function updateFlipbook(flipbookId: string, data: {
    title: string;
    description?: string;
    ageGroup?: string;
    heyzineUrl?: string; // Changed from pdfUrl
    isPublished?: boolean;
    isFree?: boolean;
}) {
    try {
        const updateData: {
            title: string;
            description?: string;
            ageGroup?: string | null;
            isPublished?: boolean;
            isFree?: boolean;
            heyzineUrl?: string;
            iframeContent?: string;
            coverImageUrl?: string;
        } = {
            title: data.title,
            description: data.description,
            // normalize incoming ageGroup: empty -> null, any "all" variant -> "all"
            ageGroup: data.ageGroup && data.ageGroup.trim() !== "" ? (/all/i.test(data.ageGroup) ? "all" : data.ageGroup) : null,
            isPublished: data.isPublished,
            isFree: data.isFree
        };

        if (data.heyzineUrl) {
             const { iframeContent, thumbnailUrl } = await fetchHeyzineData(data.heyzineUrl);
             updateData.heyzineUrl = data.heyzineUrl;
             updateData.iframeContent = iframeContent;
             updateData.coverImageUrl = thumbnailUrl;
             // We don't remove old PDF/cover explicitly here as they might still be useful or managed differently.
             // If we want to clean up, we could do it, but for now let's focus on the switch.
        }

        // Auto-derive categoryId whenever ageGroup is provided
        if ("ageGroup" in data) {
            const slug = categorySlugForAgeGroup(updateData.ageGroup);
            const cat = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
            (updateData as any).categoryId = cat?.id ?? null;
        }

        await prisma.flipbook.update({
            where: { id: flipbookId },
            data: updateData
        });

        revalidatePath("/admin/flipbooks");
        revalidatePath("/parent/flipbooks");
        return { success: true };
    } catch (error) {
        console.error("Failed to update flipbook:", error);
        return { error: error instanceof Error ? error.message : "Failed to update flipbook" };
    }
}

export async function deleteFlipbook(flipbookId: string) {
    try {
        // Get flipbook to retrieve file URLs
        const flipbook = await prisma.flipbook.findUnique({
            where: { id: flipbookId },
            select: { pdfUrl: true, coverImageUrl: true }
        });

        // Wipe all flipbook assets from storage before removing DB row
        await deleteFlipbookAssets(flipbookId).catch((e) => console.error("Asset wipe failed for", flipbookId, e));

        // Delete related progress first if cascade isn't set
        await prisma.flipbookProgress.deleteMany({
            where: { flipbookId }
        });

        // Delete the flipbook record
        await prisma.flipbook.delete({
            where: { id: flipbookId }
        });
        
        revalidatePath("/admin/flipbooks");
        revalidatePath("/parent/flipbooks");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete flipbook:", error);
        return { error: "Failed to delete flipbook" };
    }
}

export async function getAllFlipbooks() {
    try {
        const flipbooks = await prisma.flipbook.findMany({
            include: { createdBy: true },
            orderBy: { createdAt: "desc" }
        });

        // Auto-publish scheduled flipbooks that have reached their publish date
        const now = new Date();
        const toPublish = flipbooks.filter(
            fb => !fb.isPublished && fb.publishedAt && fb.publishedAt <= now
        );

        if (toPublish.length > 0) {
            await prisma.flipbook.updateMany({
                where: {
                    id: { in: toPublish.map(fb => fb.id) }
                },
                data: { isPublished: true }
            });

            // Refetch to get updated data
            return await prisma.flipbook.findMany({
                include: { createdBy: true },
                orderBy: { createdAt: "desc" }
            });
        }

        return flipbooks;
    } catch (error) {
        console.error("Failed to get all flipbooks:", error);
        throw error;
    }
}

export async function getCustomerFlipbooks(childProfileId?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    const role = (session.user as { role?: string }).role;

    if (childProfileId) {
        if (!canUseParentLibraryForChild(role, childProfileId)) {
            throw new Error("Unauthorized");
        }
    } else if (!canUseCustomerLibrary(role)) {
        throw new Error("Parents must select a child profile to view flipbooks");
    }

    try {
        const now = new Date();
        
        let childAgeGroup: string | null = null;
        if (childProfileId) {
            const child = await prisma.childProfile.findFirst({
                where: { id: childProfileId, parentId: session.user.id }
            });
            if (!child) {
                throw new Error("Invalid child profile");
            }
            childAgeGroup = child.ageGroup;
        }
        
        // Check for active paid subscription for the specific profile.
        const activeSubscription = await prisma.subscription.findFirst({
            where: { 
                customerId: session.user.id,
                childProfileId: childProfileId || null,
                status: "ACTIVE",
                endDate: { gte: now },
                plan: {
                    price: { gt: 0 }
                }
            },
            include: { plan: true }
        });

        const hasPaidSubscription = !!activeSubscription;

        // Auto-publish scheduled flipbooks that have reached their publish date
        await prisma.flipbook.updateMany({
            where: {
                isPublished: false,
                publishedAt: { lte: now }
            },
            data: { isPublished: true }
        });

        // Get flipbooks with progress - only show published ones or scheduled for past
        const flipbooks = await prisma.flipbook.findMany({
            where: { 
                isPublished: true,
                AND: [
                    {
                        OR: [
                            { publishedAt: null },
                            { publishedAt: { lte: now } }
                        ]
                    },
                    ...(childAgeGroup ? [{
                        OR: [
                            { ageGroup: childAgeGroup },
                            { ageGroup: { contains: "all", mode: "insensitive" as const } },
                            { ageGroup: "" },
                            { ageGroup: null }
                        ]
                    }] : []),
                    ...(hasPaidSubscription ? [] : [{ isFree: true }])
                ]
            },
            include: {
                progress: {
                    where: { 
                        customerId: session.user.id,
                        ...(childProfileId ? { childProfileId } : { childProfileId: null })
                    },
                    take: 1
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // Flatten progress (take first item from array) and serialize to plain objects
        const flipbooksWithProgress = (flipbooks as any).map((fb: any) => {
            const progress = fb.progress?.[0] || null;
            return {
                id: fb.id,
                title: fb.title,
                description: fb.description,
                coverImageUrl: fb.coverImageUrl,
                pdfUrl: fb.pdfUrl,
                heyzineUrl: fb.heyzineUrl,
                iframeContent: fb.iframeContent,
                pagesManifest: fb.pagesManifest,
                totalPages: fb.totalPages,
                ageGroup: fb.ageGroup,
                isPublished: fb.isPublished,
                isFree: fb.isFree,
                createdAt: fb.createdAt.toISOString(),
                updatedAt: fb.updatedAt.toISOString(),
                progress: progress ? {
                    id: progress.id,
                    lastPageRead: progress.lastPageRead,
                    completed: progress.completed,
                    lastAccessedAt: progress.lastAccessedAt.toISOString()
                } : null
            };
        });

        return {
            flipbooks: flipbooksWithProgress,
            hasSubscription: hasPaidSubscription
        };
    } catch (error) {
        console.error("Failed to get customer flipbooks:", error);
        throw error;
    }
}

export async function updateFlipbookProgress(data: {
    flipbookId: string;
    lastPageRead: number;
    completed: boolean;
    childProfileId?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    const role = (session.user as { role?: string }).role;

    if (data.childProfileId) {
        if (!canUseParentLibraryForChild(role, data.childProfileId)) {
            throw new Error("Unauthorized");
        }
    } else if (!canUseCustomerLibrary(role)) {
        throw new Error("Parents must select a child profile to track progress");
    }

    try {
        // Verify childProfileId belongs to the parent if provided
        if (data.childProfileId) {
            const child = await prisma.childProfile.findFirst({
                where: { id: data.childProfileId, parentId: session.user.id }
            });
            if (!child) {
                throw new Error("Invalid child profile");
            }
        }

        // To support unique constraints properly if childProfileId is optional, 
        // we might need to handle the case where it is null. Prisma allows null in unique constraints 
        // if specified in schema. But wait, schema says:
        // @@unique([customerId, flipbookId], name: "customerId_flipbookId")
        // @@unique([childProfileId, flipbookId], name: "childProfileId_flipbookId")
        
        // Let's use findFirst then create/update to be safe instead of upsert if schema constraints are tricky
        const existingProgress = await prisma.flipbookProgress.findFirst({
            where: {
                customerId: session.user.id,
                flipbookId: data.flipbookId,
                childProfileId: data.childProfileId || null
            }
        });

        if (existingProgress) {
            await prisma.flipbookProgress.update({
                where: { id: existingProgress.id },
                data: {
                    lastPageRead: data.lastPageRead,
                    completed: data.completed,
                    lastAccessedAt: new Date()
                }
            });
        } else {
            await prisma.flipbookProgress.create({
                data: {
                    customerId: session.user.id,
                    flipbookId: data.flipbookId,
                    childProfileId: data.childProfileId || null,
                    lastPageRead: data.lastPageRead,
                    completed: data.completed,
                    lastAccessedAt: new Date()
                }
            });
        }

        revalidatePath("/parent");
        revalidatePath("/parent/flipbooks");
        return { success: true };
    } catch (error) {
        console.error("Failed to update flipbook progress:", error);
        throw error;
    }
}

export async function getAllCategories() {
    return [];
}

export async function reRenderFlipbook(id: string) {
  try {
    await assertAdminOrOpsForFlipbook();
    const fb = await prisma.flipbook.findUnique({
      where: { id },
      select: { id: true, sourceType: true, pdfUrl: true, processingStartedAt: true },
    });
    if (!fb) return { error: "Flipbook not found" };
    if (fb.sourceType !== "SELF_HOSTED") return { error: "Only self-hosted flipbooks can be re-rendered" };
    if (!fb.pdfUrl) return { error: "No source PDF on record — re-upload required" };
    if (fb.processingStartedAt && Date.now() - fb.processingStartedAt.getTime() < 10 * 60 * 1000) {
      return { error: "Re-render already in progress" };
    }

    await prisma.flipbook.update({
      where: { id },
      data: { processingStartedAt: new Date() },
    });

    // Fetch the original PDF from storage (resolved as URL or local path)
    let buf: Buffer;
    if (fb.pdfUrl.startsWith("/uploads/")) {
      const fsMod = await import("fs/promises");
      const pathMod = await import("path");
      const base = process.env.UPLOAD_DIR_BASE || pathMod.join(process.cwd(), "public", "uploads");
      const relative = fb.pdfUrl.replace("/uploads/", "");
      buf = await fsMod.readFile(pathMod.join(base, relative));
    } else {
      const res = await fetch(fb.pdfUrl);
      if (!res.ok) throw new Error(`Cannot fetch source PDF: ${res.status}`);
      buf = Buffer.from(await res.arrayBuffer());
    }

    const result = await processPdf(buf);

    // Write new pages under flipbooks/<id>/v<timestamp>/ then atomic-swap
    const ts = Date.now();
    const folder = `flipbooks/${id}/v${ts}`;
    const optimizedUrl = await uploadBuffer(result.optimizedPdf, "application/pdf", folder, "optimized.pdf");
    const newPages = [];
    for (let i = 0; i < result.pages.length; i++) {
      const name = `page-${String(i + 1).padStart(3, "0")}.webp`;
      const url = await uploadBuffer(result.pages[i].buffer, "image/webp", folder, name);
      newPages.push({ url, width: result.pages[i].width, height: result.pages[i].height });
    }

    const manifest = {
      totalPages: result.totalPages,
      pages: newPages,
      generatedAt: new Date().toISOString(),
    };

    await prisma.flipbook.update({
      where: { id },
      data: {
        optimizedPdfUrl: optimizedUrl,
        pagesManifest: manifest as any,
        totalPages: result.totalPages,
        processingStartedAt: null,
      },
    });

    // Note: old page assets remain at flipbooks/<id>/page-*.webp.
    // They become orphan but harmless. A maintenance pass can prune older v* folders.

    revalidatePath("/admin/flipbooks");
    return { success: true };
  } catch (e: any) {
    await prisma.flipbook.update({ where: { id }, data: { processingStartedAt: null } }).catch(() => {});
    if (e.message === "Unauthorized") return { error: "Unauthorized" };
    return { error: e?.message || "Re-render failed" };
  }
}

export async function getFlipbooksGroupedByCategory() {
  await assertAdminOrOpsForFlipbook();
  const [categories, flipbooks] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.flipbook.findMany({
      orderBy: { createdAt: "desc" },
      include: { categoryRef: true },
    }),
  ]);

  const uncategorized = flipbooks.filter((f) => !f.categoryId);
  const groups = categories.map((c) => ({
    category: c,
    flipbooks: flipbooks.filter((f) => f.categoryId === c.id),
  }));

  if (uncategorized.length > 0) {
    groups.push({
      category: { id: "__uncategorized__", name: "Uncategorized", slug: "uncategorized", displayOrder: 9999, createdAt: new Date() } as any,
      flipbooks: uncategorized,
    });
  }

  return groups;
}
