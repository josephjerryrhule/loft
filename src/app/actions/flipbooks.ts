"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const flipbookSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  pdfUrl: z.string().min(1, "PDF file is required"),
  coverImageUrl: z.string().optional(),
  category: z.string().optional(),
  isFree: z.boolean().optional(),
  schedulePublish: z.boolean().optional(),
  publishedAt: z.string().optional(),
});

export async function createFlipbook(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const pdfUrl = formData.get("pdfUrl") as string;
  const coverImageUrl = formData.get("coverImageUrl") as string;
  const category = formData.get("category") as string;
  const isFree = formData.get("isFree") === "on";
  const schedulePublish = formData.get("schedulePublish") === "on";
  const publishedAt = formData.get("publishedAt") as string;

  try {
    const validatedData = flipbookSchema.parse({ 
      title, 
      description, 
      pdfUrl, 
      coverImageUrl, 
      category, 
      isFree,
      schedulePublish,
      publishedAt
    });

    const publishDate = schedulePublish && publishedAt ? new Date(publishedAt) : null;
    const isPublishedNow = !schedulePublish || (publishDate && publishDate <= new Date());

    await prisma.flipbook.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        pdfUrl: validatedData.pdfUrl,
        coverImageUrl: validatedData.coverImageUrl,
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
    if (error instanceof z.ZodError) {
      console.error("Validation errors:", error.errors);
      return { error: `Validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}` };
    }
    return { error: "Failed to create flipbook" };
  }
}

export async function updateFlipbook(flipbookId: string, data: {
    title: string;
    description?: string;
    category?: string;
    pdfUrl?: string;
    coverImageUrl?: string;
    isPublished?: boolean;
    isFree?: boolean;
}) {
    try {
        // Get old file URLs if new ones are provided (for cleanup)
        let oldFiles: { pdfUrl?: string | null, coverImageUrl?: string | null } = {};
        if (data.pdfUrl || data.coverImageUrl) {
            const existing = await prisma.flipbook.findUnique({
                where: { id: flipbookId },
                select: { pdfUrl: true, coverImageUrl: true }
            });
            oldFiles = existing || {};
        }

        await prisma.flipbook.update({
            where: { id: flipbookId },
            data: {
                title: data.title,
                description: data.description,
                category: data.category,
                pdfUrl: data.pdfUrl,
                coverImageUrl: data.coverImageUrl,
                isPublished: data.isPublished,
                isFree: data.isFree
            }
        });

        // Delete old files from storage if they were replaced
        const { deleteFromSupabase } = await import("@/lib/upload");
        
        if (data.pdfUrl && oldFiles.pdfUrl && oldFiles.pdfUrl !== data.pdfUrl) {
            await deleteFromSupabase(oldFiles.pdfUrl);
        }
        
        if (data.coverImageUrl && oldFiles.coverImageUrl && oldFiles.coverImageUrl !== data.coverImageUrl) {
            await deleteFromSupabase(oldFiles.coverImageUrl);
        }

        revalidatePath("/admin/flipbooks");
        revalidatePath("/customer/flipbooks");
        return { success: true };
    } catch (error) {
        console.error("Failed to update flipbook:", error);
        return { error: "Failed to update flipbook" };
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
