"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkAndGeneratePayablePayouts, checkAndGenerateAllMaturedPayouts } from "@/lib/payout-utils";
import { headers } from "next/headers";

export async function getAmbassadorPayouts(page: number = 1, limit: number = 10) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const userId = session.user.id;

    try {
        // 1. Generate any matured payable payouts first on the fly
        await checkAndGeneratePayablePayouts(userId);

        // Fetch user name
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true }
        });
        const userName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Ambassador";

        // 2. Fetch payouts with pagination
        const skip = (page - 1) * limit;
        const [payouts, total] = await Promise.all([
            prisma.payout.findMany({
                where: { userId },
                orderBy: { weekStart: "desc" },
                skip,
                take: limit
            }),
            prisma.payout.count({
                where: { userId }
            })
        ]);

        return {
            userName,
            payouts: payouts.map(p => ({
                ...p,
                amountGHS: Number(p.amountGHS),
                amountUSD: Number(p.amountUSD),
                weekStart: p.weekStart.toISOString(),
                weekEnd: p.weekEnd.toISOString(),
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString(),
                approvedAt: p.approvedAt?.toISOString() || null,
                signedAt: p.signedAt?.toISOString() || null,
                paidAt: p.paidAt?.toISOString() || null,
            })),
            total,
            totalPages: Math.ceil(total / limit)
        };
    } catch (e) {
        console.error("Failed to fetch payouts:", e);
        return { error: "Failed to fetch payouts" };
    }
}

export async function signPayoutSlip(payoutId: string, typedName: string, clientIp?: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const payout = await prisma.payout.findUnique({
            where: { id: payoutId },
            include: { user: true }
        });

        if (!payout) return { error: "Payout statement not found" };
        if (payout.userId !== session.user.id) return { error: "Unauthorized" };
        if (payout.status !== "APPROVED") return { error: "Payout must be in APPROVED status to be signed" };

        if (!typedName.trim()) {
            return { error: "A typed signature is required" };
        }

        let resolvedIp = clientIp;
        try {
            const headersList = await headers();
            const forwardedFor = headersList.get("x-forwarded-for");
            if (forwardedFor) {
                resolvedIp = forwardedFor.split(',')[0].trim();
            } else {
                const realIp = headersList.get("x-real-ip");
                if (realIp) {
                    resolvedIp = realIp.trim();
                }
            }
        } catch (e) {
            // fallback
        }
        if (!resolvedIp || resolvedIp === "127.0.0.1" || resolvedIp === "::1" || resolvedIp === "localhost") {
            resolvedIp = clientIp || "Unknown";
        }

        await prisma.$transaction(async (tx) => {
            // Update payout status to SIGNED
            await tx.payout.update({
                where: { id: payoutId },
                data: {
                    status: "SIGNED",
                    signedAt: new Date(),
                    signatureName: typedName.trim(),
                    signatureIp: resolvedIp
                }
            });

            // Log activity
            await tx.activityLog.create({
                data: {
                    userId: session.user.id,
                    actionType: "PAYOUT_SIGNED",
                    actionDetails: JSON.stringify({
                        payoutId,
                        weekStart: payout.weekStart.toISOString(),
                        weekEnd: payout.weekEnd.toISOString(),
                        amountGHS: Number(payout.amountGHS),
                        amountUSD: Number(payout.amountUSD),
                        signatureName: typedName.trim()
                    })
                }
            });
        });

        // Revalidate cache
        revalidatePath("/settings");
        revalidatePath("/admin/finance");
        revalidatePath("/affiliate/commissions");
        revalidatePath("/manager/commissions");

        return { success: true };
    } catch (e) {
        console.error("Failed to sign payout slip:", e);
        return { error: "Failed to sign payout statement" };
    }
}

export async function getAdminPayoutQueue() {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        return { error: "Unauthorized" };
    }

    try {
        // 1. Generate payouts on the fly for all matured commissions
        await checkAndGenerateAllMaturedPayouts();

        // 2. Fetch all payouts with their user info
        const payouts = await prisma.payout.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        status: true,
                        payoutMethodType: true,
                        payoutDetails: true
                    }
                }
            },
            orderBy: { weekStart: "desc" }
        });

        return {
            payouts: payouts.map(p => ({
                ...p,
                amountGHS: Number(p.amountGHS),
                amountUSD: Number(p.amountUSD),
                weekStart: p.weekStart.toISOString(),
                weekEnd: p.weekEnd.toISOString(),
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString(),
                approvedAt: p.approvedAt?.toISOString() || null,
                signedAt: p.signedAt?.toISOString() || null,
                paidAt: p.paidAt?.toISOString() || null,
            }))
        };
    } catch (e) {
        console.error("Failed to fetch admin payout queue:", e);
        return { error: "Failed to fetch payout queue" };
    }
}

export async function approvePayoutStatement(payoutId: string) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        return { error: "Unauthorized" };
    }

    try {
        const payout = await prisma.payout.findUnique({
            where: { id: payoutId },
            include: { commissions: true }
        });

        if (!payout) return { error: "Payout statement not found" };
        if (payout.status !== "PAYABLE") return { error: "Payout must be in PAYABLE status to be approved" };

        const adminIdentifier = session.user.email || session.user.id;

        await prisma.$transaction(async (tx) => {
            // Update payout status to APPROVED
            await tx.payout.update({
                where: { id: payoutId },
                data: {
                    status: "APPROVED",
                    approvedAt: new Date(),
                    approvedBy: adminIdentifier
                }
            });

            // Update associated commissions to APPROVED
            await tx.commission.updateMany({
                where: { payoutId },
                data: { status: "APPROVED" }
            });

            // Log activity
            await tx.activityLog.create({
                data: {
                    userId: payout.userId,
                    actionType: "PAYOUT_APPROVED",
                    actionDetails: JSON.stringify({
                        payoutId,
                        approvedBy: adminIdentifier,
                        amountGHS: Number(payout.amountGHS),
                        amountUSD: Number(payout.amountUSD),
                    })
                }
            });
        });

        revalidatePath("/admin/finance");
        revalidatePath("/affiliate/commissions");
        revalidatePath("/manager/commissions");

        return { success: true };
    } catch (e) {
        console.error("Failed to approve payout:", e);
        return { error: "Failed to approve payout statement" };
    }
}

export async function markPayoutAsPaid(
    payoutId: string, 
    data: { 
        paymentMethod: string; 
        paymentRef: string; 
        amountPaid: number; 
        recipientAcc: string; 
        proofUrl: string; 
        paidAtStr: string;
    }
) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        return { error: "Unauthorized" };
    }

    try {
        const payout = await prisma.payout.findUnique({
            where: { id: payoutId },
            include: { user: true }
        });

        if (!payout) return { error: "Payout statement not found" };
        if (payout.status !== "SIGNED" && payout.status !== "REVIEW_NEEDED") {
            return { error: "Payout statement must be signed by the user or flagged for review before marking as paid" };
        }

        // Validate amount matching (either GHS or USD must match the paid amount)
        const payoutGHS = Number(payout.amountGHS);
        const payoutUSD = Number(payout.amountUSD);
        const amt = Number(data.amountPaid);

        let currencyMatch = false;
        if (payoutGHS > 0 && Math.abs(payoutGHS - amt) < 0.01) {
            currencyMatch = true;
        } else if (payoutUSD > 0 && Math.abs(payoutUSD - amt) < 0.01) {
            currencyMatch = true;
        }

        if (!currencyMatch) {
            // Mismatch occurs: update status to REVIEW_NEEDED
            await prisma.payout.update({
                where: { id: payoutId },
                data: {
                    status: "REVIEW_NEEDED",
                    paymentMethod: data.paymentMethod,
                    paymentRef: data.paymentRef,
                    recipientAcc: data.recipientAcc,
                    proofUrl: data.proofUrl,
                    paidAt: new Date(data.paidAtStr)
                }
            });

            await prisma.activityLog.create({
                data: {
                    userId: payout.userId,
                    actionType: "PAYOUT_PAYMENT_MISMATCH",
                    actionDetails: JSON.stringify({
                        payoutId,
                        expectedGHS: payoutGHS,
                        expectedUSD: payoutUSD,
                        amountPaid: amt,
                        error: "Amount paid does not match payout statement amount"
                    })
                }
            });

            revalidatePath("/admin/finance");
            return { error: "Payment mismatch flagged! Payout marked for review.", reviewNeeded: true };
        }

        // Validate recipient account matching
        const normalizedRecipient = data.recipientAcc.trim().replace(/\s+/g, "");
        const normalizedDetails = payout.user.payoutDetails?.trim().replace(/\s+/g, "") || "";
        
        // Mismatch check (if user details are empty or mismatch)
        if (!normalizedRecipient || !normalizedDetails.includes(normalizedRecipient)) {
             // Let's flag for review
             await prisma.payout.update({
                where: { id: payoutId },
                data: {
                    status: "REVIEW_NEEDED",
                    paymentMethod: data.paymentMethod,
                    paymentRef: data.paymentRef,
                    recipientAcc: data.recipientAcc,
                    proofUrl: data.proofUrl,
                    paidAt: new Date(data.paidAtStr)
                }
             });

             await prisma.activityLog.create({
                data: {
                    userId: payout.userId,
                    actionType: "PAYOUT_RECIPIENT_MISMATCH",
                    actionDetails: JSON.stringify({
                        payoutId,
                        expectedDetails: payout.user.payoutDetails,
                        providedRecipient: data.recipientAcc,
                        error: "Provided recipient account does not match user registered payout details"
                    })
                }
             });

             revalidatePath("/admin/finance");
             return { error: "Recipient mismatch flagged! Payout marked for review.", reviewNeeded: true };
        }

        // Perfect match: transition to PAID
        await prisma.$transaction(async (tx) => {
            await tx.payout.update({
                where: { id: payoutId },
                data: {
                    status: "PAID",
                    paymentMethod: data.paymentMethod,
                    paymentRef: data.paymentRef,
                    recipientAcc: data.recipientAcc,
                    proofUrl: data.proofUrl,
                    paidAt: new Date(data.paidAtStr)
                }
            });

            // Update commissions to PAID
            await tx.commission.updateMany({
                where: { payoutId },
                data: { 
                    status: "PAID",
                    paidAt: new Date(data.paidAtStr)
                }
            });

            // Log activity
            await tx.activityLog.create({
                data: {
                    userId: payout.userId,
                    actionType: "PAYOUT_COMPLETED",
                    actionDetails: JSON.stringify({
                        payoutId,
                        amountPaid: amt,
                        paymentRef: data.paymentRef
                    })
                }
            });
        });

        revalidatePath("/admin/finance");
        revalidatePath("/affiliate/commissions");
        revalidatePath("/manager/commissions");

        return { success: true };
    } catch (e) {
        console.error("Failed to complete payout payment:", e);
        return { error: "Failed to mark payout as paid" };
    }
}

export async function unapprovePayoutStatement(payoutId: string) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        return { error: "Unauthorized" };
    }

    try {
        const payout = await prisma.payout.findUnique({
            where: { id: payoutId },
            include: { commissions: true }
        });

        if (!payout) return { error: "Payout statement not found" };
        if (!["APPROVED", "SIGNED", "REVIEW_NEEDED"].includes(payout.status)) {
            return { error: "Payout must be in APPROVED, SIGNED, or REVIEW_NEEDED status to be unapproved" };
        }

        // Delete proof URL if it exists
        if (payout.proofUrl) {
            const { deleteFromSupabase } = await import("@/lib/upload");
            await deleteFromSupabase(payout.proofUrl);
        }

        const adminIdentifier = session.user.email || session.user.id;

        await prisma.$transaction(async (tx: any) => {
            // Update payout status back to PAYABLE and clear details
            await tx.payout.update({
                where: { id: payoutId },
                data: {
                    status: "PAYABLE",
                    approvedAt: null,
                    approvedBy: null,
                    signedAt: null,
                    signatureName: null,
                    signatureIp: null,
                    paymentMethod: null,
                    paymentRef: null,
                    recipientAcc: null,
                    proofUrl: null,
                    paidAt: null
                }
            });

            // Revert commissions status to PENDING
            await tx.commission.updateMany({
                where: { payoutId },
                data: { status: "PENDING" }
            });

            // Log activity
            await tx.activityLog.create({
                data: {
                    userId: payout.userId,
                    actionType: "PAYOUT_UNAPPROVED",
                    actionDetails: JSON.stringify({
                        payoutId,
                        unapprovedBy: adminIdentifier,
                        amountGHS: Number(payout.amountGHS),
                        amountUSD: Number(payout.amountUSD),
                        previousStatus: payout.status
                    })
                }
            });
        });

        revalidatePath("/admin/finance");
        revalidatePath("/affiliate/commissions");
        revalidatePath("/manager/commissions");

        return { success: true };
    } catch (e) {
        console.error("Failed to unapprove payout:", e);
        return { error: "Failed to unapprove payout statement" };
    }
}

export async function unpayPayoutStatement(payoutId: string) {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        return { error: "Unauthorized" };
    }

    try {
        const payout = await prisma.payout.findUnique({
            where: { id: payoutId }
        });

        if (!payout) return { error: "Payout statement not found" };
        if (payout.status !== "PAID") {
            return { error: "Payout must be in PAID status to be unpaid" };
        }

        // Delete proof URL if it exists
        if (payout.proofUrl) {
            const { deleteFromSupabase } = await import("@/lib/upload");
            await deleteFromSupabase(payout.proofUrl);
        }

        const adminIdentifier = session.user.email || session.user.id;

        await prisma.$transaction(async (tx: any) => {
            // Revert payout status to SIGNED and clear payment details (keep signature details)
            await tx.payout.update({
                where: { id: payoutId },
                data: {
                    status: "SIGNED",
                    paymentMethod: null,
                    paymentRef: null,
                    recipientAcc: null,
                    proofUrl: null,
                    paidAt: null
                }
            });

            // Revert commissions status to APPROVED and clear paidAt
            await tx.commission.updateMany({
                where: { payoutId },
                data: { 
                    status: "APPROVED",
                    paidAt: null 
                }
            });

            // Log activity
            await tx.activityLog.create({
                data: {
                    userId: payout.userId,
                    actionType: "PAYOUT_UNPAID",
                    actionDetails: JSON.stringify({
                        payoutId,
                        unpaidBy: adminIdentifier,
                        amountGHS: Number(payout.amountGHS),
                        amountUSD: Number(payout.amountUSD),
                        previousRef: payout.paymentRef
                    })
                }
            });
        });

        revalidatePath("/admin/finance");
        revalidatePath("/affiliate/commissions");
        revalidatePath("/manager/commissions");

        return { success: true };
    } catch (e) {
        console.error("Failed to unpay payout:", e);
        return { error: "Failed to unpay payout statement" };
    }
}
