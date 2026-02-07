"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z, ZodError } from "zod";

const flipbookSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  heyzineUrl: z.string().url("Must be a valid URL"),
  category: z.string().optional(),
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
  const category = formData.get("category") as string;
  const isFree = formData.get("isFree") === "on";
  const schedulePublish = formData.get("schedulePublish") === "on";
  const publishedAt = formData.get("publishedAt") as string;

  try {
    const validatedData = flipbookSchema.parse({ 
      title, 
      description, 
      heyzineUrl,
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
        category: validatedData.category,
        createdById: session.user.id,
        isPublished: isPublishedNow,
        isFree: validatedData.isFree || false,
        publishedAt: publishDate,
      },
    });

    revalidatePath("/admin/flipbooks");
    revalidatePath("/customer/flipbooks");
    
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
    category?: string;
    heyzineUrl?: string; // Changed from pdfUrl
    isPublished?: boolean;
    isFree?: boolean;
}) {
    try {
        let updateData: any = {
            title: data.title,
            description: data.description,
            category: data.category,
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
        revalidatePath("/customer/flipbooks");
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
        revalidatePath("/customer/flipbooks");
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

export async function getCustomerFlipbooks() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    try {
        const now = new Date();
        
        // Check for active subscription (must be ACTIVE and not expired)
        const activeSubscription = await prisma.subscription.findFirst({
            where: { 
                customerId: session.user.id,
                status: "ACTIVE",
                endDate: { gte: now }
            },
            include: { plan: true }
        });

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
                OR: [
                    { publishedAt: null },
                    { publishedAt: { lte: now } }
                ],
                ...(activeSubscription ? {} : { isFree: true })
            },
            include: {
                progress: {
                    where: { customerId: session.user.id },
                    take: 1
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // Flatten progress (take first item from array) and serialize to plain objects
        const flipbooksWithProgress = flipbooks.map(fb => {
            const progress = fb.progress[0] || null;
            return {
                id: fb.id,
                title: fb.title,
                description: fb.description,
                coverImageUrl: fb.coverImageUrl,
                pdfUrl: fb.pdfUrl,
                heyzineUrl: fb.heyzineUrl,
                iframeContent: fb.iframeContent,
                totalPages: fb.totalPages,
                category: fb.category,
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
            hasSubscription: !!activeSubscription
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
}) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    try {
        await prisma.flipbookProgress.upsert({
            where: {
                customerId_flipbookId: {
                    customerId: session.user.id,
                    flipbookId: data.flipbookId
                }
            },
            create: {
                customerId: session.user.id,
                flipbookId: data.flipbookId,
                lastPageRead: data.lastPageRead,
                completed: data.completed,
                lastAccessedAt: new Date()
            },
            update: {
                lastPageRead: data.lastPageRead,
                completed: data.completed,
                lastAccessedAt: new Date()
            }
        });

        revalidatePath("/customer");
        revalidatePath("/customer/flipbooks");
        return { success: true };
    } catch (error) {
        console.error("Failed to update flipbook progress:", error);
        throw error;
    }
}

export async function getAllCategories() {
    try {
        const categories = await prisma.flipbook.findMany({
            where: {
                category: { not: null }
            },
            select: {
                category: true
            },
            distinct: ['category']
        });

        return categories
            .map(f => f.category)
            .filter((cat): cat is string => cat !== null)
            .sort();
    } catch (error) {
        console.error("Failed to get categories:", error);
        return [];
    }
}
