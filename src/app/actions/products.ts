"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// ... keep existing imports ...

// Schema reference for server-side validation
const productSchema = z.object({
  title: z.string().min(3),
  price: z.number().min(0),
  description: z.string().optional(),
  type: z.string(), // DIGITAL, PHYSICAL
  featuredImageUrl: z.string().optional(),
  affiliateCommission: z.number().min(0),
});

export async function createProduct(formData: FormData) {
  // ... existing code ...
  const title = formData.get("title") as string;
  const price = parseFloat(formData.get("price") as string);
  const description = formData.get("description") as string;
  const type = formData.get("type") as string;
  const featuredImageUrl = formData.get("featuredImageUrl") as string;
  const affiliateCommission = parseFloat(formData.get("affiliateCommission") as string);

  try {
    const validatedData = productSchema.parse({ 
        title, 
        price, 
        description, 
        type, 
        featuredImageUrl, 
        affiliateCommission 
    });

    await prisma.product.create({
      data: {
        title: validatedData.title,
        price: validatedData.price,
        description: validatedData.description,
        productType: validatedData.type,
        featuredImageUrl: validatedData.featuredImageUrl,
        affiliateCommissionAmount: validatedData.affiliateCommission,
        isActive: true,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
  } catch (error) {
    console.error("Failed to create product:", error);
    throw new Error("Failed to create product");
  }
    
  redirect("/admin/products");
}

export async function updateProduct(formData: FormData) {
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const price = parseFloat(formData.get("price") as string);
    const description = formData.get("description") as string;
    const type = formData.get("type") as string;
    const featuredImageUrl = formData.get("featuredImageUrl") as string;
    const affiliateCommission = parseFloat(formData.get("affiliateCommission") as string);

    if (!id) throw new Error("Product ID is required");

    try {
        const validatedData = productSchema.parse({ 
            title, 
            price, 
            description, 
            type, 
            featuredImageUrl, 
            affiliateCommission 
        });

        await prisma.product.update({
            where: { id },
            data: {
                title: validatedData.title,
                price: validatedData.price,
                description: validatedData.description,
                productType: validatedData.type,
                featuredImageUrl: validatedData.featuredImageUrl,
                affiliateCommissionAmount: validatedData.affiliateCommission,
            },
        });

        revalidatePath("/admin/products");
        revalidatePath("/products");
    } catch (error) {
        console.error("Failed to update product:", error);
        throw new Error("Failed to update product");
    }
    
    // redirect("/admin/products"); // Optional, might just want to close dialog
}

export async function deleteProduct(id: string) {
    try {
        await prisma.product.delete({
            where: { id },
        });
        revalidatePath("/admin/products");
        revalidatePath("/products");
    } catch (error) {
        console.error("Failed to delete product:", error);
        throw new Error("Failed to delete product");
    }
}

export async function getAllProducts() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: "desc" }
        });
        return products;
    } catch (error) {
        console.error("Failed to get all products:", error);
        throw error;
    }
}

