"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { auth } from "@/auth";
import { sendAccountStatusChangeEmail } from "@/lib/email";
import { canUseCustomerLibrary } from "@/lib/access-control.mjs";
import { z } from "zod";

export async function updateUser(userId: string, data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    role: string;
    status: string;
    ambassadorExpiry?: Date | null;
    profilePictureUrl?: string | null;
}) {
    try {
        const session = await auth();
        // @ts-ignore - role exists in our custom session type
        if (!session?.user || session.user.role !== "ADMIN") {
            return { error: "Unauthorized" };
        }

        // Get current user to check if status is changing or if we need to generate an ID
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { status: true, email: true, firstName: true, lastName: true, role: true, ambassadorId: true },
        });
        
        if (!currentUser) return { error: "User not found" };
        
        const statusChanged = currentUser.status !== data.status;
        const roleChanged = currentUser.role !== data.role;
        
        let ambassadorId = currentUser.ambassadorId;
        const prefix = data.role === "MANAGER" ? "LFT-MGR" : "LFT-AMB";
        
        // Auto-generate ID if role is MANAGER or AFFILIATE and they don't have one 
        // OR if their current ID doesn't match the new role's prefix (Managers should have LFT-MGR)
        if ((data.role === "MANAGER" || data.role === "AFFILIATE") && (!ambassadorId || !ambassadorId.startsWith(prefix))) {
          const existingUsers = await prisma.user.findMany({
            where: {
              ambassadorId: { startsWith: prefix }
            },
            select: { ambassadorId: true }
          });

          let maxNum = 0;
          existingUsers.forEach(u => {
            if (u.ambassadorId) {
              const parts = u.ambassadorId.split("-");
              const num = parseInt(parts[parts.length - 1]);
              if (!isNaN(num) && num > maxNum) maxNum = num;
            }
          });
          
          ambassadorId = `${prefix}-${(maxNum + 1).toString().padStart(3, "0")}`;
        }
        
        await prisma.user.update({
            where: { id: userId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phoneNumber: data.phoneNumber,
                role: data.role, 
                status: data.status, 
                ambassadorId,
                ambassadorExpiry: data.ambassadorExpiry,
                profilePictureUrl: data.profilePictureUrl,
            }
        });
        
        // Send email notification if status changed
        if (statusChanged && currentUser) {
          sendAccountStatusChangeEmail({
            userEmail: data.email,
            userName: `${data.firstName} ${data.lastName}`.trim() || "User",
            oldStatus: currentUser.status,
            newStatus: data.status,
          }).catch(console.error);
        }
        
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to update user:", error);
        return { error: "Failed to update user" };
    }
}

export async function deleteUser(userId: string) {
    try {
        const session = await auth();
        // @ts-ignore - role exists in our custom session type
        if (!session?.user || session.user.role !== "ADMIN") {
            return { error: "Unauthorized" };
        }

        await prisma.$transaction(async (tx) => {
            // 1. Detach managed users (if this user was a manager)
            await tx.user.updateMany({
                where: { managerId: userId },
                data: { managerId: null }
            });

            // 2. Detach referrals
            await tx.user.updateMany({
                where: { referredById: userId },
                data: { referredById: null }
            });

            // 3. Detach referred orders
            await tx.order.updateMany({
                where: { referredById: userId },
                data: { referredById: null }
            });

            // 4. Delete ActivityLog
            await tx.activityLog.deleteMany({ where: { userId } });

            // 5. Delete Commission
            await tx.commission.deleteMany({ where: { userId } });

            // 6. Delete PayoutRequest
            await tx.payoutRequest.deleteMany({ where: { userId } });

            // 7. Delete Subscription
            await tx.subscription.deleteMany({ where: { customerId: userId } });

            // 8. Delete Order
            await tx.order.deleteMany({ where: { customerId: userId } });

            // 9. Delete Invitations sent by user
            await tx.invitation.deleteMany({ where: { inviterId: userId } });

            // 10. Handle Flipbooks and Progress
            // First, delete progress records for flipbooks OWNED by this user (others reading their books)
            const userFlipbooks = await tx.flipbook.findMany({
                where: { createdById: userId },
                select: { id: true }
            });
            
            if (userFlipbooks.length > 0) {
                const flipbookIds = userFlipbooks.map(f => f.id);
                await tx.flipbookProgress.deleteMany({
                    where: { flipbookId: { in: flipbookIds } }
                });
            }

            // Delete progress records OF this user (books they are reading)
            await tx.flipbookProgress.deleteMany({ where: { customerId: userId } });

            // 11. Delete Flipbooks created by user
            await tx.flipbook.deleteMany({ where: { createdById: userId } });

            // Note: PasswordResetToken and EmailVerificationToken have onDelete: Cascade in schema,
            // so they will be automatically deleted when the user is deleted.

            // 12. Finally, Delete User
            await tx.user.delete({ where: { id: userId } });
        }, {
            maxWait: 5000, // default: 2000
            timeout: 20000, // default: 5000
        });

        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete user:", error);
        return { error: "Failed to delete user. An internal error occurred." };
    }
}

const profileSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
    profilePictureUrl: z.string().optional().nullable(),
});

export async function updateProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }
    
    const rawData = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        phoneNumber: formData.get("phoneNumber"),
        address: formData.get("address"),
        city: formData.get("city"),
        state: formData.get("state"),
        postalCode: formData.get("postalCode"),
        country: formData.get("country"),
        profilePictureUrl: formData.get("profilePictureUrl"),
    };

    const validatedData = profileSchema.safeParse(rawData);

    if (!validatedData.success) {
        return { error: "Invalid input: " + validatedData.error.issues.map(e => e.message).join(", ") };
    }

    const { firstName, lastName, phoneNumber, address, city, state, postalCode, country, profilePictureUrl } = validatedData.data;
    
    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                firstName,
                lastName,
                phoneNumber: phoneNumber || null,
                address: address || null,
                city: city || null,
                state: state || null,
                postalCode: postalCode || null,
                country: country || null,
                profilePictureUrl: profilePictureUrl || null,
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
    noStore();
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    if (!canUseCustomerLibrary((session.user as { role?: string }).role)) {
        throw new Error("Unauthorized");
    }

    try {
        const subscription = await prisma.subscription.findFirst({
            where: {
                customerId: session.user.id,
                childProfileId: null,
                status: "ACTIVE",
                endDate: { gte: new Date() }
            },
            include: { plan: true },
            orderBy: { createdAt: "desc" }
        });

        const completedBooks = await prisma.flipbookProgress.count({
            where: { 
                customerId: session.user.id, 
                completed: true 
            }
        });

        return {
            subscription: subscription ? {
                ...subscription,
                plan: {
                    ...subscription.plan,
                    price: subscription.plan.price.toNumber()
                }
            } : null,
            completedBooks
        };
    } catch (error) {
        console.error("Failed to get customer dashboard data:", error);
        throw error;
    }
}

export async function getParentDashboardData() {
    noStore();
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    try {
        // Get child profiles with their subscriptions and reading progress
        const childProfiles = await prisma.childProfile.findMany({
            where: { parentId: session.user.id },
            include: {
                subscriptions: {
                    where: {
                        status: "ACTIVE",
                        endDate: { gte: new Date() }
                    },
                    include: { plan: true },
                    orderBy: { createdAt: "desc" }
                },
                flipbookProgress: {
                    where: { completed: true }
                }
            }
        });

        const formattedChildProfiles = childProfiles.map(child => ({
            ...child,
            activeSubscription: child.subscriptions[0] ? {
                ...child.subscriptions[0],
                plan: {
                    ...child.subscriptions[0].plan,
                    price: child.subscriptions[0].plan.price.toNumber()
                }
            } : null,
            completedBooks: child.flipbookProgress.length
        }));

        return {
            childProfiles: formattedChildProfiles
        };
    } catch (error) {
        console.error("Failed to get parent dashboard data:", error);
        throw error;
    }
}

export async function getAmbassadorData() {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                ambassadorId: true,
                ambassadorExpiry: true,
                profilePictureUrl: true,
                inviteCode: true,
            }
        });
        return user;
    } catch (error) {
        console.error("Failed to get ambassador data:", error);
        return null;
    }
}
