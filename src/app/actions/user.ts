"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sendAccountStatusChangeEmail } from "@/lib/email";

export async function updateUser(userId: string, data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    role: string;
    status: string;
}) {
    try {
        // Get current user to check if status is changing
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { status: true, email: true, firstName: true, lastName: true },
        });
        
        const statusChanged = currentUser && currentUser.status !== data.status;
        
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

export async function updateProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }
    
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const postalCode = formData.get("postalCode") as string;
    const country = formData.get("country") as string;
    
    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                firstName,
                lastName,
                phoneNumber,
                address: address || null,
                city: city || null,
                state: state || null,
                postalCode: postalCode || null,
                country: country || null,
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
                status: "ACTIVE",
                endDate: { gte: new Date() }
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

