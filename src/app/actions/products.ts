"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const productSchema = z.object({
  title: z.string().min(3),
  price: z.number().min(0),
  description: z.string().optional(),
  type: z.string(), // DIGITAL, PHYSICAL
  featuredImageUrl: z.string().optional(),
  affiliateCommission: z.number().min(0),
});

export async function createProduct(formData: FormData) {
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
    // return { error: "Failed to create product" };
    throw new Error("Failed to create product");
  }
    
  redirect("/admin/products");
}
