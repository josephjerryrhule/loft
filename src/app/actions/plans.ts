"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { processSubscriptionCommission } from "@/lib/commission";
import { canCreateSubscriptionForProfile } from "@/lib/access-control.mjs";

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
    const affiliateCommissionPercentageStr = formData.get("affiliateCommissionPercentage") as string;
    
    // Parse affiliate commission percentage (optional field)
    let affiliateCommissionPercentage = null;
    if (affiliateCommissionPercentageStr && affiliateCommissionPercentageStr.trim() !== "") {
        const parsed = parseFloat(affiliateCommissionPercentageStr);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
            affiliateCommissionPercentage = parsed;
        }
    }

    try {
        await prisma.subscriptionPlan.create({
            data: {
                name,
                description,
                price,
                durationDays,
                features,
                affiliateCommissionPercentage,
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
    const affiliateCommissionPercentageStr = formData.get("affiliateCommissionPercentage") as string;
    
    // Parse affiliate commission percentage (optional field)
    let affiliateCommissionPercentage = null;
    if (affiliateCommissionPercentageStr && affiliateCommissionPercentageStr.trim() !== "") {
        const parsed = parseFloat(affiliateCommissionPercentageStr);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
            affiliateCommissionPercentage = parsed;
        }
    }

    try {
        await prisma.subscriptionPlan.update({
            where: { id },
            data: {
                name,
                description,
                price,
                durationDays,
                features,
                affiliateCommissionPercentage,
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

export async function getUserSubscription(userId: string, childId?: string) {
    return await prisma.subscription.findFirst({
        where: { 
            customerId: userId,
            childProfileId: childId || null,
            status: "ACTIVE",
            endDate: { gte: new Date() }
        },
        include: { plan: true }
    });
}

export async function getUserSubscriptions(userId: string) {
    return await prisma.subscription.findMany({
        where: { 
            customerId: userId,
            status: "ACTIVE",
            endDate: { gte: new Date() }
        },
        include: { 
            plan: true,
            childProfile: true
        }
    });
}

export async function subscribeToPlan(planId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    // This legacy action only creates self subscriptions.
    // Parents must subscribe through child-profile checkout instead.
    if (!canCreateSubscriptionForProfile((session.user as any).role, null)) {
        return { error: "Parents can only subscribe for a child profile" };
    }

    const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId }
    });
    
    if (!plan) return { error: "Plan not found" };

    // Calculate subscription dates (start: now, end: now + duration days)
    const startDate = new Date();
    const endDate = new Date(startDate.getTime());
    endDate.setDate(endDate.getDate() + plan.durationDays);

    try {
        // Cancel any existing active subscriptions for the same profile
        await prisma.subscription.updateMany({
            where: { 
                customerId: session.user.id,
                childProfileId: null, // Defaulting to parent if no childId provided in this action
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
        
        revalidatePath("/parent");
        revalidatePath("/parent/plans");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "Failed to subscribe" };
    }
}

export async function assignSubscriptionToChild(subscriptionId: string, childId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };
    const userId = session.user.id;

    try {
        // Verify ownership and that it's unassigned
        const subscription = await prisma.subscription.findFirst({
            where: { 
                id: subscriptionId, 
                customerId: userId,
                childProfileId: null,
                status: "ACTIVE"
            }
        });

        if (!subscription) {
            return { error: "Subscription not found or already assigned" };
        }

        // Verify child ownership
        const child = await prisma.childProfile.findFirst({
            where: { id: childId, parentId: userId }
        });

        if (!child) {
            return { error: "Child profile not found" };
        }

        // Assign to child and cancel any existing active subscriptions for that child
        await prisma.$transaction([
            prisma.subscription.updateMany({
                where: {
                    customerId: userId,
                    childProfileId: childId,
                    status: "ACTIVE"
                },
                data: { status: "CANCELLED" }
            }),
            prisma.subscription.update({
                where: { id: subscriptionId },
                data: { childProfileId: childId }
            }),
            prisma.activityLog.create({
                data: {
                    userId,
                    actionType: "ASSIGN_SUBSCRIPTION",
                    actionDetails: JSON.stringify({
                        subscriptionId,
                        childId,
                        childName: child.name
                    })
                }
            })
        ]);

        revalidatePath("/parent");
        revalidatePath("/parent/plans");
        revalidatePath("/parent/children");
        
        return { success: true };
    } catch (e) {
        console.error("Failed to assign subscription:", e);
        return { error: "Failed to assign subscription" };
    }
}

