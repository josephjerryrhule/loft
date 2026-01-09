"use server";

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
  createdById: z.string(),
});

export async function createFlipbook(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const pdfUrl = formData.get("pdfUrl") as string;
  const coverImageUrl = formData.get("coverImageUrl") as string;
  const createdById = formData.get("createdById") as string;
  const category = formData.get("category") as string;
  const isFree = formData.get("isFree") === "on";

  try {
    const validatedData = flipbookSchema.parse({ title, description, pdfUrl, coverImageUrl, createdById, category, isFree });

    await prisma.flipbook.create({
      data: {
        ...validatedData,
        isPublished: true,
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
