"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { processSubscriptionCommission } from "@/lib/commission";

export async function getPlans() {
    return await prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { price: "asc" }
    });
}

export async function getAllPlans() {
    return await prisma.subscriptionPlan.findMany({
        orderBy: { createdAt: "desc" }
    });
}

export async function createPlan(formData: FormData) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const durationDays = parseInt(formData.get("durationDays") as string);
    const features = formData.get("features") as string;

    try {
        await prisma.subscriptionPlan.create({
            data: {
                name,
                description,
                price,
                durationDays,
                features,
                isActive: true
            }
        });
        revalidatePath("/admin/plans");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "Failed to create plan" };
    }
}

export async function updatePlan(id: string, formData: FormData) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const durationDays = parseInt(formData.get("durationDays") as string);
    const features = formData.get("features") as string;
    const isActive = formData.get("isActive") === "true";

    try {
        await prisma.subscriptionPlan.update({
            where: { id },
            data: {
                name,
                description,
                price,
                durationDays,
                features,
                isActive
            }
        });
        revalidatePath("/admin/plans");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "Failed to update plan" };
    }
}

export async function deletePlan(id: string) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    try {
        await prisma.subscriptionPlan.delete({
            where: { id }
        });
        revalidatePath("/admin/plans");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "Failed to delete plan" };
    }
}

export async function getUserSubscription(userId: string) {
    return await prisma.subscription.findFirst({
        where: { 
            customerId: userId,
            status: "ACTIVE"
        },
        include: { plan: true }
    });
}

export async function subscribeToPlan(planId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId }
    });
    
    if (!plan) return { error: "Plan not found" };

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    try {
        // Cancel any existing active subscriptions
        await prisma.subscription.updateMany({
            where: { 
                customerId: session.user.id,
                status: "ACTIVE"
            },
            data: { status: "CANCELLED" }
        });

        const subscription = await prisma.subscription.create({
            data: {
                customerId: session.user.id,
                planId,
                status: "ACTIVE",
                startDate,
                endDate,
                autoRenew: false
            }
        });

        // Process commission for referrer
        await processSubscriptionCommission(
            subscription.id, 
            session.user.id, 
            Number(plan.price)
        );

        // Log activity for the customer
        await prisma.activityLog.create({
            data: {
                userId: session.user.id,
                actionType: "SUBSCRIPTION",
                actionDetails: `Subscribed to ${plan.name} plan`
            }
        });
        
        revalidatePath("/customer");
        revalidatePath("/customer/plans");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "Failed to subscribe" };
    }
}

