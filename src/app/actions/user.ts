"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { auth } from "@/auth";
import { sendAccountStatusChangeEmail, sendHierarchyChangeEmail } from "@/lib/email";
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
    managerId?: string | null;
    teamLeaderId?: string | null;
    referredById?: string | null;
}) {
    try {
        const session = await auth();
        const viewerRole = (session?.user as any)?.role;
        const viewerId = session?.user?.id;
        
        if (!viewerId || (viewerRole !== "ADMIN" && viewerRole !== "OPERATIONS_MANAGER" && viewerRole !== "MANAGER")) {
            return { error: "Unauthorized" };
        }

        // Get current user to check permissions and state
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { 
                id: true,
                status: true, 
                email: true, 
                firstName: true, 
                lastName: true, 
                role: true, 
                ambassadorId: true,
                managerId: true,
                teamLeaderId: true,
                referredById: true,
            },
        });
        
        if (!currentUser) return { error: "User not found" };

        // Manager specific restrictions
        if (viewerRole === "MANAGER") {
            if (currentUser.managerId !== viewerId) {
                return { error: "Unauthorized: You can only update your own team members" };
            }
            // Managers can't change emails or promote to roles above them
            if (currentUser.email !== data.email) {
                return { error: "Managers cannot change user emails" };
            }
            if (data.role !== "TEAM_LEADER" && data.role !== "AFFILIATE" && data.role !== currentUser.role) {
                return { error: "Managers can only promote to Team Leader or Affiliate" };
            }
        }

        // Check referredById update permissions
        if (currentUser.referredById !== data.referredById) {
            if (viewerRole !== "ADMIN" && viewerRole !== "OPERATIONS_MANAGER") {
                return { error: "Unauthorized: Only Admins and Operations Managers can modify linked ambassadors." };
            }
        }
        
        const statusChanged = currentUser.status !== data.status;
        
        let ambassadorId = currentUser.ambassadorId;
        const prefix = data.role === "MANAGER" ? "LFT-MGR" : 
                       data.role === "OPERATIONS_MANAGER" ? "LFT-OPS" : 
                       data.role === "TEAM_LEADER" ? "LFT-TL" : "LFT-AMB";
        
        // Auto-generate ID if role is an ambassador role and they don't have one 
        const isAmbassadorRole = ["MANAGER", "AFFILIATE", "TEAM_LEADER", "OPERATIONS_MANAGER"].includes(data.role);
        if (isAmbassadorRole && (!ambassadorId || !ambassadorId.startsWith(prefix))) {
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
                managerId: data.managerId,
                teamLeaderId: data.teamLeaderId,
                referredById: data.referredById,
            }
        });
        
        // Log promotion/assignment if applicable
        if (currentUser.role !== data.role || currentUser.managerId !== data.managerId) {
            await prisma.activityLog.create({
                data: {
                    userId: viewerId,
                    actionType: "USER_HIERARCHY_UPDATE",
                    actionDetails: JSON.stringify({
                        targetUserId: userId,
                        oldRole: currentUser.role,
                        newRole: data.role,
                        oldManagerId: currentUser.managerId,
                        newManagerId: data.managerId
                    })
                }
            });
        }

        // Send hierarchy change emails
        if (currentUser.role !== data.role) {
            sendHierarchyChangeEmail({
                userEmail: data.email,
                userName: `${data.firstName} ${data.lastName}`.trim(),
                type: "PROMOTION",
                newRole: data.role
            }).catch(console.error);
        } else if (currentUser.managerId !== data.managerId || currentUser.teamLeaderId !== data.teamLeaderId) {
            // Fetch names for assignment email
            const [mgr, tl] = await Promise.all([
                data.managerId ? prisma.user.findUnique({ where: { id: data.managerId }, select: { firstName: true, lastName: true } }) : null,
                data.teamLeaderId ? prisma.user.findUnique({ where: { id: data.teamLeaderId }, select: { firstName: true, lastName: true } }) : null
            ]);

            sendHierarchyChangeEmail({
                userEmail: data.email,
                userName: `${data.firstName} ${data.lastName}`.trim(),
                type: "ASSIGNMENT",
                managerName: mgr ? `${mgr.firstName} ${mgr.lastName}` : undefined,
                teamLeaderName: tl ? `${tl.firstName} ${tl.lastName}` : undefined
            }).catch(console.error);
        }

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
        revalidatePath("/manager/team");
        return { success: true };
    } catch (error) {
        console.error("Failed to update user:", error);
        return { error: "Failed to update user" };
    }
}

export async function deleteUser(userId: string) {
    try {
        const session = await auth();
        const role = (session?.user as any)?.role;
        if (!session?.user || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
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

export async function getCustomerOrders(page = 1, pageSize = 10) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const skip = (page - 1) * pageSize;

    try {
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: { customerId: session.user.id },
                include: { 
                    product: true,
                    referredBy: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: pageSize
            }),
            prisma.order.count({
                where: { customerId: session.user.id }
            })
        ]);

        // Serialize to plain objects
        return {
            orders: orders.map(order => ({
                id: order.id,
                orderNumber: order.orderNumber,
                quantity: order.quantity,
                unitPrice: order.unitPrice.toNumber(),
                totalAmount: order.totalAmount.toNumber(),
                customizationData: order.customizationData,
                status: order.status,
                paymentStatus: order.paymentStatus,
                paymentReference: order.paymentReference,
                completedFileUrl: order.completedFileUrl,
                customerUploadUrl: order.customerUploadUrl,
                createdAt: order.createdAt.toISOString(),
                product: {
                    id: order.product.id,
                    title: order.product.title,
                    description: order.product.description,
                    productType: order.product.productType,
                    price: order.product.price.toNumber(),
                    featuredImageUrl: order.product.featuredImageUrl
                },
                referredBy: order.referredBy ? {
                    firstName: order.referredBy.firstName,
                    lastName: order.referredBy.lastName,
                    email: order.referredBy.email
                } : null
            })),
            total,
            totalPages: Math.ceil(total / pageSize)
        };
    } catch (error) {
        console.error("Failed to get customer orders:", error);
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
