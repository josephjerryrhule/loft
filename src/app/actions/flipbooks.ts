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

  try {
    const validatedData = flipbookSchema.parse({ title, description, pdfUrl, coverImageUrl, category, isFree });

    await prisma.flipbook.create({
      data: {
        ...validatedData,        createdById: session.user.id,        isPublished: true,
        isFree: validatedData.isFree || false,
      },
    });

    revalidatePath("/admin/flipbooks");
    revalidatePath("/customer/flipbooks");
  } catch (error) {
    console.error("Failed to create flipbook:", error);
    throw new Error("Failed to create flipbook");
  }
    
  redirect("/admin/flipbooks");
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
        // Optional: Delete related progress first if cascade isn't set
        await prisma.flipbookProgress.deleteMany({
            where: { flipbookId }
        });

        await prisma.flipbook.delete({
            where: { id: flipbookId }
        });
        
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
        // Check for active subscription
        const activeSubscription = await prisma.subscription.findFirst({
            where: { 
                customerId: session.user.id,
                status: "ACTIVE"
            },
            include: { plan: true }
        });

        // Get flipbooks with progress
        const flipbooks = await prisma.flipbook.findMany({
            where: { 
                isPublished: true,
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

        // Flatten progress (take first item from array)
        const flipbooksWithProgress = flipbooks.map(fb => ({
            ...fb,
            progress: fb.progress[0] || null
        }));

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
