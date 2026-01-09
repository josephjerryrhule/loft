"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function approveCommission(commissionId: string) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
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
                    userId: session.user.id,
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

export async function approvePayoutRequest(requestId: string) {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
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
                    userId: session.user.id,
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
