"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function updateUser(userId: string, data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    role: string;
    status: string;
}) {
    // ... existing implementation ...
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phoneNumber: data.phoneNumber,
                role: data.role, 
                status: data.status, 
            }
        });
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to update user:", error);
        return { error: "Failed to update user" };
    }
}

export async function deleteUser(userId: string) {
    // ... existing implementation ...
    try {
        await prisma.user.delete({
            where: { id: userId }
        });
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete user:", error);
        // Check for foreign key constraints usually
        return { error: "Failed to delete user. They may have related records (orders, logs) that prevent deletion." };
    }
}

export async function updateProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }
    
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    
    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                firstName,
                lastName,
                phoneNumber
            }
        });
        revalidatePath("/settings");
        return { success: true };
    } catch (error) {
        console.log("Error updating profile:", error);
        return { error: "Failed to update profile" };
    }
}

export async function getCustomerDashboardData() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    try {
        // Get active subscription
        const subscription = await prisma.subscription.findFirst({
            where: { 
                customerId: session.user.id,
                status: "ACTIVE"
            },
            include: { plan: true }
        });

        // Get completed books count
        const completedBooks = await prisma.flipbookProgress.count({
            where: { 
                customerId: session.user.id, 
                completed: true 
            }
        });

        // Get books in progress
        const inProgress = await prisma.flipbookProgress.findMany({
            where: { 
                customerId: session.user.id, 
                completed: false,
                lastPageRead: { gt: 0 }
            },
            include: { flipbook: true },
            orderBy: { lastAccessedAt: "desc" },
            take: 3
        });

        return {
            subscription: subscription ? {
                ...subscription,
                plan: {
                    ...subscription.plan,
                    price: subscription.plan.price.toNumber()
                }
            } : null,
            completedBooks,
            inProgress
        };
    } catch (error) {
        console.error("Failed to get customer dashboard data:", error);
        throw error;
    }
}

