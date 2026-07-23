"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";
import { canUseCustomerLibrary, canUseParentLibraryForChild } from "@/lib/access-control.mjs";

const flipbookSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  heyzineUrl: z.string().url("Must be a valid URL"),
  ageGroup: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
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

export async function createFlipbook(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const heyzineUrl = formData.get("heyzineUrl") as string;
  const rawCategory = formData.get("category") as string | null;
  const category = rawCategory && rawCategory.trim() !== "" ? rawCategory.trim() : null;
  const rawAgeGroup = formData.get("ageGroup") as string | null;
  // Normalize age group: empty -> null, any variant containing "all" -> "all"
  const ageGroup = rawAgeGroup && rawAgeGroup.trim() !== "" ? rawAgeGroup.trim() : null;
  const normalizedAgeGroup = ageGroup && /all/i.test(ageGroup) ? "all" : ageGroup;
  const isFree = formData.get("isFree") === "on";
  const schedulePublish = formData.get("schedulePublish") === "on";
  const publishedAt = formData.get("publishedAt") as string;

  try {
    const validatedData = flipbookSchema.parse({ 
      title, 
      description, 
      heyzineUrl,
      ageGroup: normalizedAgeGroup,
      category,
      isFree,
      schedulePublish,
      publishedAt
    });

    // Fetch data from Heyzine
    const { iframeContent, thumbnailUrl } = await fetchHeyzineData(validatedData.heyzineUrl);

    const publishDate = schedulePublish && publishedAt ? new Date(publishedAt) : null;
    const isPublishedNow = !schedulePublish || (publishDate ? publishDate <= new Date() : false);

    await prisma.flipbook.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        heyzineUrl: validatedData.heyzineUrl,
        iframeContent,
        coverImageUrl: thumbnailUrl,
        ageGroup: validatedData.ageGroup,
        category: validatedData.category,
        createdById: session.user.id,
        isPublished: isPublishedNow,
        isFree: validatedData.isFree || false,
        publishedAt: publishDate,
      },
    });

    revalidatePath("/admin/flipbooks");
    revalidatePath("/parent/flipbooks");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to create flipbook:", error);
    if (error instanceof ZodError) {
      console.error("Validation errors:", error.issues);
      return { error: `Validation failed: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}` };
    }
    return { error: error instanceof Error ? error.message : "Failed to create flipbook" };
  }
}

export async function updateFlipbook(flipbookId: string, data: {
    title: string;
    description?: string;
    ageGroup?: string;
    category?: string;
    heyzineUrl?: string; // Changed from pdfUrl
    isPublished?: boolean;
    isFree?: boolean;
}) {
    try {
        const updateData: {
            title: string;
            description?: string;
            ageGroup?: string | null;
            category?: string | null;
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
            category: data.category && data.category.trim() !== "" ? data.category.trim() : null,
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

        // Delete related progress first if cascade isn't set
        await prisma.flipbookProgress.deleteMany({
            where: { flipbookId }
        });

        // Delete the flipbook record
        await prisma.flipbook.delete({
            where: { id: flipbookId }
        });

        // Delete files from storage after successful DB deletion
        if (flipbook) {
            const { deleteFromSupabase } = await import("@/lib/upload");
            
            if (flipbook.pdfUrl) {
                await deleteFromSupabase(flipbook.pdfUrl);
            }
            
            if (flipbook.coverImageUrl) {
                await deleteFromSupabase(flipbook.coverImageUrl);
            }
        }
        
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

export async function resyncFlipbookCovers() {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("Unauthorized");

        const flipbooks = await prisma.flipbook.findMany({
            where: { heyzineUrl: { not: null } },
            select: { id: true, heyzineUrl: true }
        });

        let updatedCount = 0;
        for (const book of flipbooks) {
            if (!book.heyzineUrl) continue;
            try {
                const { iframeContent, thumbnailUrl } = await fetchHeyzineData(book.heyzineUrl);
                if (thumbnailUrl) {
                    await prisma.flipbook.update({
                        where: { id: book.id },
                        data: { coverImageUrl: thumbnailUrl, iframeContent }
                    });
                    updatedCount++;
                }
            } catch (err) {
                console.error(`Failed to resync cover for book ${book.id}:`, err);
            }
        }

        revalidatePath("/admin/flipbooks");
        revalidatePath("/parent/flipbooks");
        return { success: true, updatedCount };
    } catch (error) {
        console.error("Failed to resync flipbook covers:", error);
        return { error: error instanceof Error ? error.message : "Failed to resync covers" };
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
