"use server";

import { prisma } from "@/lib/prisma";
import { Role, UserStatus } from "@/lib/types"; // using local types if available, or just strings if schema uses strings
import { revalidatePath } from "next/cache";

// Using Schema strings for now since local Enums might not match perfectly if not carefully synced
// but let's try to use the types we defined
// actually the schema uses String for enums now, so we can just use strings or the constants

export async function updateUser(userId: string, data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    role: string;
    status: string;
}) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phoneNumber: data.phoneNumber,
                role: data.role, // Prisma expects string
                status: data.status, // Prisma expects string
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
