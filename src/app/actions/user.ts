"use server";

// ... existing code ...

import { auth } from "@/auth"; // Need to import auth

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

