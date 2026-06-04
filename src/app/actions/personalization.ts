"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getOrderForCustomization(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        product: true,
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          }
        }
      }
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const role = (session.user as any).role;
    const isOwner = order.customerId === session.user.id;
    const isAdmin = role === "ADMIN" || role === "OPERATIONS_MANAGER";

    if (!isOwner && !isAdmin) {
      throw new Error("Unauthorized access to order");
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customizationData: order.customizationData,
      customerUploadUrl: order.customerUploadUrl,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt.toISOString(),
      customer: {
        firstName: order.customer.firstName || "",
        lastName: order.customer.lastName || "",
        email: order.customer.email,
        phoneNumber: order.customer.phoneNumber || "",
      },
      product: {
        id: order.product.id,
        title: order.product.title,
        description: order.product.description || "",
        featuredImageUrl: order.product.featuredImageUrl || "",
        requiresCustomization: order.product.requiresCustomization,
        customizationFields: order.product.customizationFields || null,
      }
    };
  } catch (error) {
    console.error("Failed to get order for customization:", error);
    throw error;
  }
}

export async function submitOrderCustomization(orderId: string, customizationJson: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const role = (session.user as any).role;
    const isOwner = order.customerId === session.user.id;
    const isAdmin = role === "ADMIN" || role === "OPERATIONS_MANAGER";

    if (!isOwner && !isAdmin) {
      throw new Error("Unauthorized access to order");
    }

    // Parse the incoming JSON to extract headshot if it exists
    let headshotUrl = null;
    try {
      const parsed = JSON.parse(customizationJson);
      if (parsed?.photos?.headshot) {
        headshotUrl = parsed.photos.headshot;
      }
    } catch (e) {
      console.warn("Could not parse customization data JSON", e);
    }

    // Update order with customization details and set status to PROCESSING
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        customizationData: customizationJson,
        customerUploadUrl: headshotUrl || order.customerUploadUrl, // Keep primary headshot reference here too
        status: "PROCESSING" // Set to processing now that personalization details are submitted
      }
    });

    revalidatePath("/customer/orders");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/personalizations");
    
    return { success: true, orderId: updatedOrder.id };
  } catch (error) {
    console.error("Failed to submit customization:", error);
    throw error;
  }
}

export async function getPersonalizations() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const isAdmin = role === "ADMIN" || role === "OPERATIONS_MANAGER";
  
  if (!session?.user?.id || !isAdmin) {
    throw new Error("Unauthorized");
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        product: {
          requiresCustomization: true
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profilePictureUrl: true,
            status: true,
          }
        },
        product: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      quantity: order.quantity,
      unitPrice: order.unitPrice.toNumber(),
      totalAmount: order.totalAmount.toNumber(),
      customizationData: order.customizationData,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt.toISOString(),
      customer: {
        id: order.customer.id,
        firstName: order.customer.firstName || "",
        lastName: order.customer.lastName || "",
        email: order.customer.email,
        phoneNumber: order.customer.phoneNumber || "",
        profilePictureUrl: order.customer.profilePictureUrl || "",
      },
      product: {
        id: order.product.id,
        title: order.product.title,
        description: order.product.description || "",
        featuredImageUrl: order.product.featuredImageUrl || "",
        requiresCustomization: order.product.requiresCustomization,
      }
    }));
  } catch (error) {
    console.error("Failed to fetch personalizations:", error);
    throw error;
  }
}
