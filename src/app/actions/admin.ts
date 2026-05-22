"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendPayoutApprovalEmail, sendAccountStatusChangeEmail, sendOrderStatusChangeEmail } from "@/lib/email";
import { canCreateSubscriptionForProfile } from "@/lib/access-control.mjs";

export async function approveCommission(commissionId: string) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        return { error: "Unauthorized" };
    }

    try {
        const commission = await prisma.commission.findUnique({
            where: { id: commissionId },
            include: { user: true }
        });

        if (!commission) return { error: "Commission not found" };
        if (commission.status !== "PENDING") return { error: "Commission already processed" };

        await prisma.$transaction(async (tx) => {
            // Update commission status to APPROVED
            await tx.commission.update({
                where: { id: commissionId },
                data: { status: "APPROVED" }
            });

            // Log activity for the user whose commission was approved
            await tx.activityLog.create({
                data: {
                    userId: commission.userId,
                    actionType: "COMMISSION_APPROVED",
                    actionDetails: JSON.stringify({
                        commissionId: commissionId,
                        amount: Number(commission.amount),
                        sourceType: commission.sourceType
                    })
                }
            });

            // Log activity for admin who approved it
            await tx.activityLog.create({
                data: {
                    userId: session.user!.id,
                    actionType: "ADMIN_APPROVE_COMMISSION",
                    actionDetails: JSON.stringify({
                        commissionId: commissionId,
                        userId: commission.userId,
                        userEmail: commission.user.email,
                        amount: Number(commission.amount)
                    })
                }
            });
        });

        revalidatePath("/admin/finance");
        revalidatePath("/admin");
        revalidatePath("/affiliate/commissions");
        revalidatePath("/manager/commissions");
        
        return { success: true };
    } catch (e) {
        console.error("Failed to approve commission:", e);
        return { error: "Failed to approve commission" };
    }
}

export async function bulkApproveCommissions() {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        return { error: "Unauthorized" };
    }

    try {
        // Get all pending commissions
        const pendingCommissions = await prisma.commission.findMany({
            where: { status: "PENDING" },
            include: { user: true }
        });

        if (pendingCommissions.length === 0) {
            return { error: "No pending commissions to approve" };
        }

        const results = await prisma.$transaction(async (tx) => {
            // Update all pending commissions to APPROVED
            await tx.commission.updateMany({
                where: { status: "PENDING" },
                data: { status: "APPROVED" }
            });

            // Create activity logs for each user's commissions
            const userCommissions = new Map<string, { count: number; total: number }>();
            pendingCommissions.forEach(comm => {
                const existing = userCommissions.get(comm.userId) || { count: 0, total: 0 };
                userCommissions.set(comm.userId, {
                    count: existing.count + 1,
                    total: existing.total + Number(comm.amount)
                });
            });

            // Log activity for each user
            for (const [userId, data] of userCommissions.entries()) {
                await tx.activityLog.create({
                    data: {
                        userId: userId,
                        actionType: "COMMISSION_APPROVED",
                        actionDetails: JSON.stringify({
                            bulkApproval: true,
                            count: data.count,
                            totalAmount: data.total
                        })
                    }
                });
            }

            // Log activity for admin
            await tx.activityLog.create({
                data: {
                    userId: session.user!.id,
                    actionType: "ADMIN_BULK_APPROVE_COMMISSIONS",
                    actionDetails: JSON.stringify({
                        count: pendingCommissions.length,
                        totalAmount: pendingCommissions.reduce((sum, c) => sum + Number(c.amount), 0),
                        userCount: userCommissions.size
                    })
                }
            });

            return {
                approved: pendingCommissions.length,
                totalAmount: pendingCommissions.reduce((sum, c) => sum + Number(c.amount), 0)
            };
        });

        revalidatePath("/admin/finance");
        revalidatePath("/admin");
        revalidatePath("/affiliate/commissions");
        revalidatePath("/manager/commissions");
        
        return { success: true, ...results };
    } catch (e) {
        console.error("Failed to bulk approve commissions:", e);
        return { error: "Failed to approve commissions" };
    }
}

export async function bulkApproveUserCommissions(targetUserId: string) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        return { error: "Unauthorized" };
    }

    try {
        // Get all pending commissions for this specific user
        const pendingCommissions = await prisma.commission.findMany({
            where: { 
                userId: targetUserId,
                status: "PENDING" 
            },
            include: { user: true }
        });

        if (pendingCommissions.length === 0) {
            return { error: "No pending commissions to approve for this user" };
        }

        const totalAmount = pendingCommissions.reduce((sum, c) => sum + Number(c.amount), 0);

        await prisma.$transaction(async (tx) => {
            // Update user's pending commissions to APPROVED
            await tx.commission.updateMany({
                where: { 
                    userId: targetUserId,
                    status: "PENDING" 
                },
                data: { status: "APPROVED" }
            });

            // Log activity for the user
            await tx.activityLog.create({
                data: {
                    userId: targetUserId,
                    actionType: "COMMISSION_APPROVED",
                    actionDetails: JSON.stringify({
                        bulkApproval: true,
                        count: pendingCommissions.length,
                        totalAmount: totalAmount
                    })
                }
            });

            // Log activity for admin
            await tx.activityLog.create({
                data: {
                    userId: session.user!.id,
                    actionType: "ADMIN_USER_BULK_APPROVE_COMMISSIONS",
                    actionDetails: JSON.stringify({
                        targetUserId,
                        targetUserEmail: pendingCommissions[0].user.email,
                        count: pendingCommissions.length,
                        totalAmount: totalAmount
                    })
                }
            });
        });

        revalidatePath("/admin/finance");
        revalidatePath("/admin");
        revalidatePath("/affiliate/commissions");
        revalidatePath("/manager/commissions");

        return { success: true, approvedCount: pendingCommissions.length, totalAmount };
    } catch (e) {
        console.error("Failed to approve user commissions:", e);
        return { error: "Failed to approve user commissions" };
    }
}

export async function bulkApproveSelectedCommissions(commissionIds: string[]) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        return { error: "Unauthorized" };
    }

    if (!commissionIds || commissionIds.length === 0) {
        return { error: "No commissions selected" };
    }

    try {
        // Get the pending commissions that match the selection
        const pendingCommissions = await prisma.commission.findMany({
            where: {
                id: { in: commissionIds },
                status: "PENDING"
            },
            include: { user: true }
        });

        if (pendingCommissions.length === 0) {
            return { error: "No pending commissions found for the selected IDs" };
        }

        const totalAmount = pendingCommissions.reduce((sum, c) => sum + Number(c.amount), 0);

        await prisma.$transaction(async (tx) => {
            // Update selected commissions to APPROVED
            await tx.commission.updateMany({
                where: {
                    id: { in: pendingCommissions.map(c => c.id) },
                    status: "PENDING"
                },
                data: { status: "APPROVED" }
            });

            // Group by user to write activity logs
            const userCommissions = new Map<string, { count: number; total: number }>();
            pendingCommissions.forEach(comm => {
                const existing = userCommissions.get(comm.userId) || { count: 0, total: 0 };
                userCommissions.set(comm.userId, {
                    count: existing.count + 1,
                    total: existing.total + Number(comm.amount)
                });
            });

            // Create activity logs for each user's commissions
            for (const [userId, data] of userCommissions.entries()) {
                await tx.activityLog.create({
                    data: {
                        userId: userId,
                        actionType: "COMMISSION_APPROVED",
                        actionDetails: JSON.stringify({
                            bulkApproval: true,
                            count: data.count,
                            totalAmount: data.total
                        })
                    }
                });
            }

            // Log activity for admin
            await tx.activityLog.create({
                data: {
                    userId: session.user!.id,
                    actionType: "ADMIN_SELECTED_BULK_APPROVE_COMMISSIONS",
                    actionDetails: JSON.stringify({
                        count: pendingCommissions.length,
                        totalAmount: totalAmount,
                        userCount: userCommissions.size
                    })
                }
            });
        });

        revalidatePath("/admin/finance");
        revalidatePath("/admin");
        revalidatePath("/affiliate/commissions");
        revalidatePath("/manager/commissions");

        return { success: true, approvedCount: pendingCommissions.length, totalAmount };
    } catch (e) {
        console.error("Failed to approve selected commissions:", e);
        return { error: "Failed to approve selected commissions" };
    }
}

export async function approvePayoutRequest(requestId: string) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        return { error: "Unauthorized" };
    }

    try {
        const request = await prisma.payoutRequest.findUnique({
            where: { id: requestId },
            include: { user: true }
        });

        if (!request) return { error: "Request not found" };
        if (request.status !== "PENDING") return { error: "Request already processed" };

        const payoutAmount = Number(request.amount);
        const userId = request.userId;

        await prisma.$transaction(async (tx) => {
            // Get all APPROVED commissions for this user
            const approvedCommissions = await tx.commission.findMany({
                where: { 
                    userId: userId, 
                    status: "APPROVED" 
                },
                orderBy: { createdAt: 'asc' } // Process oldest first
            });

            let remainingAmount = payoutAmount;
            const commissionsToUpdate: string[] = [];

            // Mark commissions as PAID up to the payout amount
            for (const commission of approvedCommissions) {
                if (remainingAmount <= 0) break;
                
                const commissionAmount = Number(commission.amount);
                if (commissionAmount <= remainingAmount) {
                    commissionsToUpdate.push(commission.id);
                    remainingAmount -= commissionAmount;
                }
            }

            // Update commissions to PAID
            if (commissionsToUpdate.length > 0) {
                await tx.commission.updateMany({
                    where: { id: { in: commissionsToUpdate } },
                    data: { 
                        status: "PAID",
                        paidAt: new Date()
                    }
                });
            }

            // Mark payout request as PAID
            await tx.payoutRequest.update({
                where: { id: requestId },
                data: { 
                    status: "PAID", 
                    processedAt: new Date() 
                }
            });

            // Log activity for the user who received the payout
            await tx.activityLog.create({
                data: {
                    userId: userId,
                    actionType: "PAYOUT_RECEIVED",
                    actionDetails: JSON.stringify({
                        amount: payoutAmount,
                        requestId: requestId,
                        commissionsCount: commissionsToUpdate.length
                    })
                }
            });

            // Log activity for the admin who approved the payout
            await tx.activityLog.create({
                data: {
                    userId: session.user!.id,
                    actionType: "PAYOUT_APPROVED",
                    actionDetails: JSON.stringify({
                        payoutRequestId: requestId,
                        recipientId: userId,
                        recipientEmail: request.user.email,
                        amount: payoutAmount
                    })
                }
            });
        });

        // Send email notification to user about payout approval
        sendPayoutApprovalEmail({
          userEmail: request.user.email,
          userName: `${request.user.firstName || ""} ${request.user.lastName || ""}`.trim() || "User",
          amount: payoutAmount,
          status: "APPROVED",
        }).catch(console.error);

        revalidatePath("/admin/finance");
        revalidatePath("/admin");
        revalidatePath("/affiliate");
        revalidatePath("/affiliate/commissions");
        revalidatePath("/manager");
        revalidatePath("/manager/commissions");
        
        return { success: true };
    } catch (e) {
        console.error("Failed to approve payout:", e);
        return { error: "Failed to approve payout" };
    }
}

export async function getAllUsers() {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        throw new Error("Unauthorized");
    }

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                role: true,
                status: true,
                profilePictureUrl: true,
                ambassadorId: true,
                ambassadorExpiry: true,
                createdAt: true,
                managerId: true,
                teamLeaderId: true,
                referredById: true,
                referredBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        ambassadorId: true,
                    }
                },
                orders: {
                    select: {
                        totalAmount: true,
                        paymentStatus: true,
                    }
                },
                subscriptions: {
                    include: {
                        plan: true
                    }
                },
                commissions: {
                    select: {
                        amount: true,
                        status: true,
                    }
                },
                referrals: {
                    select: {
                        id: true
                    }
                },
                activityLogs: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: {
                        createdAt: true,
                        actionType: true,
                    }
                }
            }
        });
        
        // Map the results to serialize Decimal objects and compute CRM KPIs
        return users.map(user => {
            // Subscription status and active plan name
            const activeSub = user.subscriptions.find(sub => sub.status === "ACTIVE" && new Date(sub.endDate) >= new Date());
            const subscriptionStatus = activeSub ? activeSub.plan.name : "Inactive";
            
            // Total spent (paid orders + active subscription plan price)
            const paidOrdersSum = user.orders
                .filter(o => ["PAID", "COMPLETED"].includes(o.paymentStatus))
                .reduce((sum, o) => sum + Number(o.totalAmount), 0);
            
            const activeSubSum = user.subscriptions
                .filter(sub => ["ACTIVE", "PAID"].includes(sub.status) || sub.paymentStatus === "COMPLETED")
                .reduce((sum, sub) => sum + Number(sub.plan.price), 0);
                
            const totalSpent = paidOrdersSum + activeSubSum;
            const numPurchases = user.orders.filter(o => ["PAID", "COMPLETED"].includes(o.paymentStatus)).length + user.subscriptions.length;
            
            // Commission earned
            const commissionEarned = user.commissions
                .filter(c => ["PAID", "APPROVED"].includes(c.status))
                .reduce((sum, c) => sum + Number(c.amount), 0);
                
            const referralsCount = user.referrals.length;
            const lastActivity = user.activityLogs[0]?.createdAt || user.createdAt;
            
            return {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                role: user.role,
                status: user.status,
                profilePictureUrl: user.profilePictureUrl,
                ambassadorId: user.ambassadorId,
                ambassadorExpiry: user.ambassadorExpiry,
                createdAt: user.createdAt,
                managerId: user.managerId,
                teamLeaderId: user.teamLeaderId,
                referredById: user.referredById,
                referredBy: user.referredBy,
                subscriptionStatus,
                totalSpent,
                numPurchases,
                commissionEarned,
                referralsCount,
                lastActivity,
            };
        });
    } catch (error) {
        console.error("Failed to get all users:", error);
        throw error;
    }
}

function maskEmail(email: string) {
    const [local, domain] = email.split('@');
    if (!local || !domain) return '***@***.***';
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

function maskPhoneNumber(phone: string) {
    if (phone.length <= 5) return '*****';
    return `${phone.substring(0, 3)}***${phone.substring(phone.length - 2)}`;
}

export async function getUserFullProfile(userId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    const viewerId = session.user.id;
    const viewerRole = (session.user as any).role;

    try {
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                managerId: true,
                teamLeaderId: true
            }
        });
        if (!targetUser) return null;

        const isSelf = viewerId === userId;
        const isAdmin = viewerRole === "ADMIN";
        const isOpsManager = viewerRole === "OPERATIONS_MANAGER";
        const isFinance = viewerRole === "FINANCE";
        const isManagerOfUser = targetUser.managerId === viewerId;
        const isTeamLeaderOfUser = targetUser.teamLeaderId === viewerId;
        const isViewerAmbassador = ["ADMIN", "OPERATIONS_MANAGER", "MANAGER", "TEAM_LEADER", "AFFILIATE"].includes(viewerRole);
        const isTargetAmbassador = ["ADMIN", "OPERATIONS_MANAGER", "MANAGER", "TEAM_LEADER", "AFFILIATE"].includes(targetUser.role);

        // Security check
        const canViewFull = isAdmin || isOpsManager || isFinance || isSelf || isManagerOfUser || isTeamLeaderOfUser;
        const canViewSanitized = isViewerAmbassador && isTargetAmbassador;

        if (!canViewFull && !canViewSanitized) {
            throw new Error("Unauthorized");
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                referredBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        ambassadorId: true,
                    }
                },
                manager: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        ambassadorId: true,
                    }
                },
                teamLeader: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        ambassadorId: true,
                    }
                },
                referrals: {
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phoneNumber: true,
                        role: true,
                        status: true,
                        createdAt: true,
                        subscriptions: {
                            where: { status: "ACTIVE" },
                            select: {
                                paymentStatus: true,
                                plan: {
                                    select: {
                                        price: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                },
                subscriptions: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        plan: true,
                        childProfile: true,
                    }
                },
                orders: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        product: true,
                    }
                },
                referredOrders: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        product: true,
                        customer: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            }
                        }
                    }
                },
                commissions: {
                    orderBy: { createdAt: "desc" },
                },
                payoutRequests: {
                    orderBy: { requestedAt: "desc" },
                },
                activityLogs: {
                    orderBy: { createdAt: "desc" },
                    take: 100,
                },
                flipbookProgress: {
                    orderBy: { lastAccessedAt: "desc" },
                    include: {
                        flipbook: true,
                        childProfile: true,
                    }
                },
                childProfiles: {
                    include: {
                        subscriptions: {
                            include: {
                                plan: true
                            }
                        },
                        flipbookProgress: {
                            include: {
                                flipbook: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) return null;

        // Fetch hierarchy based on user role
        let managedHierarchy: any = null;

        if (user.role === "TEAM_LEADER") {
            const members = await prisma.user.findMany({
                where: { teamLeaderId: userId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    status: true,
                    role: true,
                    createdAt: true,
                    profilePictureUrl: true,
                    subscriptions: {
                        where: { status: "ACTIVE" },
                        select: {
                            paymentStatus: true,
                            plan: {
                                select: {
                                    price: true,
                                    name: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: "desc" }
            });

            managedHierarchy = {
                type: "TEAM_LEADER",
                members: members.map(m => ({
                    ...m,
                    name: `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email,
                    subscriptions: m.subscriptions.map(sub => ({
                        ...sub,
                        plan: {
                            ...sub.plan,
                            price: Number(sub.plan.price)
                        }
                    }))
                }))
            };
        } else if (user.role === "MANAGER") {
            const affiliates = await prisma.user.findMany({
                where: { managerId: userId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    status: true,
                    role: true,
                    createdAt: true,
                    profilePictureUrl: true,
                    subscriptions: {
                        where: { status: "ACTIVE" },
                        select: {
                            paymentStatus: true,
                            plan: {
                                select: {
                                    price: true,
                                    name: true
                                }
                            }
                        }
                    },
                    teamMembers: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            status: true,
                            role: true,
                            createdAt: true,
                            profilePictureUrl: true,
                            subscriptions: {
                                where: { status: "ACTIVE" },
                                select: {
                                    paymentStatus: true,
                                    plan: {
                                        select: {
                                            price: true,
                                            name: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: "desc" }
            });

            managedHierarchy = {
                type: "MANAGER",
                affiliates: affiliates.map(aff => ({
                    ...aff,
                    name: `${aff.firstName || ""} ${aff.lastName || ""}`.trim() || aff.email,
                    subscriptions: aff.subscriptions.map(sub => ({
                        ...sub,
                        plan: {
                            ...sub.plan,
                            price: Number(sub.plan.price)
                        }
                    })),
                    teamMembers: aff.teamMembers.map(m => ({
                        ...m,
                        name: `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email,
                        subscriptions: m.subscriptions.map(sub => ({
                            ...sub,
                            plan: {
                                ...sub.plan,
                                price: Number(sub.plan.price)
                            }
                        }))
                    }))
                }))
            };
        } else if (user.role === "OPERATIONS_MANAGER") {
            const staff = await prisma.user.findMany({
                where: {
                    role: { in: ["MANAGER", "TEAM_LEADER", "AFFILIATE"] }
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    status: true,
                    role: true,
                    createdAt: true,
                    managerId: true,
                    teamLeaderId: true,
                    profilePictureUrl: true,
                    subscriptions: {
                        where: { status: "ACTIVE" },
                        select: {
                            paymentStatus: true,
                            plan: {
                                select: {
                                    price: true,
                                    name: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: "desc" }
            });

            managedHierarchy = {
                type: "OPERATIONS_MANAGER",
                staff: staff.map(s => ({
                    ...s,
                    name: `${s.firstName || ""} ${s.lastName || ""}`.trim() || s.email,
                    subscriptions: s.subscriptions.map(sub => ({
                        ...sub,
                        plan: {
                            ...sub.plan,
                            price: Number(sub.plan.price)
                        }
                    }))
                }))
            };
        }

        // Serialize Decimals and format data
        const serialized = {
            ...user,
            subscriptions: user.subscriptions.map(sub => ({
                ...sub,
                plan: {
                    ...sub.plan,
                    price: Number(sub.plan.price),
                    affiliateCommissionPercentage: sub.plan.affiliateCommissionPercentage ? Number(sub.plan.affiliateCommissionPercentage) : null,
                }
            })),
            orders: user.orders.map(order => ({
                ...order,
                unitPrice: Number(order.unitPrice),
                totalAmount: Number(order.totalAmount),
            })),
            referredOrders: user.referredOrders.map(order => ({
                ...order,
                unitPrice: Number(order.unitPrice),
                totalAmount: Number(order.totalAmount),
            })),
            commissions: user.commissions.map(comm => ({
                ...comm,
                amount: Number(comm.amount),
            })),
            payoutRequests: user.payoutRequests.map(req => ({
                ...req,
                amount: Number(req.amount),
            })),
            referrals: user.referrals.map(ref => ({
                ...ref,
                subscriptions: ref.subscriptions.map(sub => ({
                    ...sub,
                    plan: {
                        ...sub.plan,
                        price: Number(sub.plan.price)
                    }
                }))
            })),
            childProfiles: user.childProfiles.map(child => ({
                ...child,
                subscriptions: child.subscriptions.map(sub => ({
                    ...sub,
                    plan: {
                        ...sub.plan,
                        price: Number(sub.plan.price),
                    }
                }))
            }))
        };

        // If not full authorization, sanitize the response to protect user privacy
        if (!canViewFull) {
            serialized.email = maskEmail(serialized.email);
            serialized.phoneNumber = serialized.phoneNumber ? maskPhoneNumber(serialized.phoneNumber) : null;
            serialized.subscriptions = [];
            serialized.orders = [];
            serialized.referredOrders = [];
            serialized.commissions = [];
            serialized.payoutRequests = [];
            serialized.activityLogs = [];
            serialized.childProfiles = [];
            serialized.flipbookProgress = [];
            serialized.referrals = [];

            if (managedHierarchy) {
                if (managedHierarchy.type === "TEAM_LEADER") {
                    managedHierarchy.members = managedHierarchy.members.map((m: any) => ({
                        ...m,
                        email: maskEmail(m.email)
                    }));
                } else if (managedHierarchy.type === "MANAGER") {
                    managedHierarchy.affiliates = managedHierarchy.affiliates.map((aff: any) => ({
                        ...aff,
                        email: maskEmail(aff.email),
                        teamMembers: aff.teamMembers.map((m: any) => ({
                            ...m,
                            email: maskEmail(m.email)
                        }))
                    }));
                } else if (managedHierarchy.type === "OPERATIONS_MANAGER") {
                    managedHierarchy.staff = managedHierarchy.staff.map((s: any) => ({
                        ...s,
                        email: maskEmail(s.email)
                    }));
                }
            }
        }

        return {
            ...serialized,
            canViewFull,
            managedHierarchy
        };
    } catch (error) {
        console.error("Failed to get user full profile:", error);
        throw error;
    }
}


export async function getAdminUserChildren(userId: string) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        throw new Error("Unauthorized");
    }

    try {
        const children = await prisma.childProfile.findMany({
            where: { parentId: userId },
            orderBy: { createdAt: "desc" },
            include: {
                subscriptions: {
                    include: {
                        plan: true
                    }
                }
            }
        });
        return children;
    } catch (error) {
        console.error("Failed to get user children:", error);
        throw error;
    }
}

export async function getAllOrders() {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        throw new Error("Unauthorized");
    }

    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                customer: true,
                product: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        price: true,
                        productType: true,
                        featuredImageUrl: true,
                    }
                },
            },
        });
        return orders;
    } catch (error) {
        console.error("Failed to get all orders:", error);
        throw error;
    }
}

export async function getFinanceData() {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        throw new Error("Unauthorized");
    }

    try {
        // Total commissions paid
        const paidCommissions = await prisma.commission.aggregate({
            _sum: { amount: true },
            where: { status: "PAID" }
        });

        // Pending commissions
        const pendingCommissions = await prisma.commission.aggregate({
            _sum: { amount: true },
            where: { status: "PENDING" }
        });

        // Approved (ready to pay)
        const approvedCommissions = await prisma.commission.aggregate({
            _sum: { amount: true },
            where: { status: "APPROVED" }
        });

        // Total revenue from orders
        const orderRevenue = await prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { paymentStatus: { in: ["PAID", "COMPLETED"] } }
        });

        // Total revenue from subscriptions
        const subscriptions = await prisma.subscription.findMany({
            include: { plan: true }
        });
        const subscriptionRevenue = subscriptions.reduce((sum: number, sub: any) => sum + Number(sub.plan.price), 0);

        const totalRevenue = (orderRevenue._sum.totalAmount?.toNumber() || 0) + subscriptionRevenue;

        // Active subscriptions count
        const activeSubscriptions = await prisma.subscription.count({
            where: { status: "ACTIVE" }
        });

        const stats = {
            paidCommissions: paidCommissions._sum.amount?.toNumber() || 0,
            pendingCommissions: pendingCommissions._sum.amount?.toNumber() || 0,
            approvedCommissions: approvedCommissions._sum.amount?.toNumber() || 0,
            totalRevenue,
            activeSubscriptions
        };

        const payoutRequests = await prisma.payoutRequest.findMany({
            include: { user: true },
            orderBy: { requestedAt: 'desc' }
        });

        const recentCommissions = await prisma.commission.findMany({
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });

        return {
            stats,
            payoutRequests,
            recentCommissions
        };
    } catch (error) {
        console.error("Failed to get finance data:", error);
        throw error;
    }
}

export async function adminAssignPlan(data: {
    userId: string;
    planId: string;
    childProfileId?: string | null;
    durationDays?: number;
    reason?: string;
}) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        return { error: "Unauthorized" };
    }

    try {
        const [user, plan] = await Promise.all([
            prisma.user.findUnique({ where: { id: data.userId }, select: { id: true, email: true, firstName: true, lastName: true, role: true } }),
            prisma.subscriptionPlan.findUnique({ where: { id: data.planId } }),
        ]);

        if (!user) return { error: "User not found" };
        if (!plan) return { error: "Plan not found" };
        if (!canCreateSubscriptionForProfile(user.role, data.childProfileId)) {
            return { error: "This user cannot receive a subscription for that profile" };
        }

        // If a childProfileId is provided, verify it belongs to the user
        if (data.childProfileId) {
            const child = await prisma.childProfile.findFirst({
                where: { id: data.childProfileId, parentId: data.userId },
            });
            if (!child) return { error: "Child profile not found or does not belong to this user" };
        }

        const duration = data.durationDays || plan.durationDays;
        const startDate = new Date();
        const endDate = new Date(startDate.getTime());
        endDate.setDate(endDate.getDate() + duration);

        await prisma.$transaction(async (tx) => {
            // Cancel any existing active subscription for the same profile
            await tx.subscription.updateMany({
                where: {
                    customerId: data.userId,
                    childProfileId: data.childProfileId || null,
                    status: "ACTIVE",
                },
                data: { status: "CANCELLED" },
            });

            // Create new subscription
            await tx.subscription.create({
                data: {
                    customerId: data.userId,
                    planId: data.planId,
                    childProfileId: data.childProfileId || null,
                    status: "ACTIVE",
                    paymentStatus: "COMPLETED",
                    startDate,
                    endDate,
                    autoRenew: false,
                    paymentReference: `ADMIN-ASSIGN-${session.user!.id}-${Date.now()}`,
                },
            });

            // Log admin activity
            await tx.activityLog.create({
                data: {
                    userId: session.user!.id,
                    actionType: "ADMIN_ASSIGN_PLAN",
                    actionDetails: JSON.stringify({
                        targetUserId: data.userId,
                        targetUserEmail: user.email,
                        planId: data.planId,
                        planName: plan.name,
                        childProfileId: data.childProfileId || null,
                        durationDays: duration,
                        reason: data.reason || "Manual admin assignment",
                    }),
                },
            });
        });

        revalidatePath("/admin/users");
        revalidatePath("/admin");
        revalidatePath("/parent/plans");
        return { success: true };
    } catch (e) {
        console.error("Failed to assign plan:", e);
        return { error: "Failed to assign plan" };
    }
}

export async function getAdminUserSubscriptions(userId: string) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        throw new Error("Unauthorized");
    }

    return prisma.subscription.findMany({
        where: {
            customerId: userId,
            status: "ACTIVE",
            endDate: { gte: new Date() },
        },
        include: {
            plan: true,
            childProfile: true,
        },
    });
}

export async function updateOrderStatus(orderId: string, status: string, completedFileUrl?: string) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        return { error: "Unauthorized" };
    }

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { 
                customer: true, 
                product: true
            }
        });

        if (!order) return { error: "Order not found" };

        // Prevent cancelling completed/shipped orders
        if (status === "CANCELLED" && (order.status === "COMPLETED" || order.status === "SHIPPED")) {
            return { error: "Cannot cancel a completed or shipped order" };
        }

        const oldStatus = order.status;

        // Process commissions outside of transaction to avoid timeout
        let commissionProcessed = false;
        
        await prisma.$transaction(async (tx) => {
            // Update order status and file URL if provided
            await tx.order.update({
                where: { id: orderId },
                data: { 
                    status,
                    ...(completedFileUrl && { completedFileUrl })
                }
            });

            // If order is being cancelled, handle commission reversal
            if (status === "CANCELLED" && oldStatus !== "CANCELLED") {
                // Cancel all commissions related to this order
                const cancelledCommissions = await tx.commission.updateMany({
                    where: { 
                        sourceId: orderId,
                        sourceType: "PRODUCT",
                        status: { in: ["PENDING", "APPROVED"] }
                    },
                    data: { status: "CANCELLED" }
                });

                // Log commission cancellations
                if (cancelledCommissions.count > 0) {
                    await tx.activityLog.create({
                        data: {
                            userId: session.user!.id,
                            actionType: "COMMISSION_CANCELLED",
                            actionDetails: JSON.stringify({
                                orderId,
                                commissionsCount: cancelledCommissions.count,
                                reason: "Order cancelled"
                            })
                        }
                    });
                }
            }

            // Log activity
            await tx.activityLog.create({
                data: {
                    userId: session.user!.id,
                    actionType: "ADMIN_UPDATE_ORDER",
                    actionDetails: JSON.stringify({
                        orderId,
                        oldStatus,
                        newStatus: status
                    })
                }
            });
        }, {
            timeout: 10000, // Increase timeout to 10 seconds
        });

        // Process commissions after transaction completes (for COMPLETED orders)
        if (status === "COMPLETED" && oldStatus !== "COMPLETED") {
            try {
                const { processOrderCommission } = await import("@/lib/commission");
                await processOrderCommission(orderId);
                
                // Log commission creation separately
                await prisma.activityLog.create({
                    data: {
                        userId: session.user!.id,
                        actionType: "COMMISSION_CREATED",
                        actionDetails: JSON.stringify({
                            orderId,
                            reason: "Order completed"
                        })
                    }
                });
                commissionProcessed = true;
            } catch (error) {
                console.error("Failed to process commission:", error);
                // Don't fail the order update if commission processing fails
            }
        }

        // Send email notification to customer
        if (order.customer && oldStatus !== status) {
          if (status === "COMPLETED") {
            // Send order completed email with download link
            const { sendOrderCompletedEmail } = await import("@/lib/email");
            sendOrderCompletedEmail({
              customerEmail: order.customer.email,
              customerName: `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim() || "Customer",
              orderId: order.orderNumber,
              productName: order.product.title,
              downloadUrl: completedFileUrl || undefined,
            }).catch(console.error);
          } else {
            // Send regular status change email
            sendOrderStatusChangeEmail({
              customerEmail: order.customer.email,
              customerName: `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim() || "Customer",
              orderId: order.orderNumber,
              oldStatus,
              newStatus: status,
            }).catch(console.error);
          }
        }

        revalidatePath("/admin/orders");
        return { success: true };
    } catch (error) {
        console.error("Failed to update order status:", error);
        return { error: "Failed to update order" };
    }
}
