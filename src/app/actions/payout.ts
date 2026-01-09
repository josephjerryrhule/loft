"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getMinimumPayoutAmount(): Promise<number> {
    try {
        const setting = await prisma.systemSettings.findUnique({
            where: { key: "minimumPayoutAmount" }
        });
        if (setting) {
            return Number(JSON.parse(setting.value));
        }
    } catch (e) {
        console.error("Failed to fetch minimum payout amount:", e);
    }
    return 50; // Default minimum
}

export async function requestPayout(amount: number, method: any) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const userId = session.user.id;

    // Get minimum payout amount from settings
    const minimumPayoutAmount = await getMinimumPayoutAmount();
    
    if (amount < minimumPayoutAmount) {
        return { error: `Amount must be at least GHS ${minimumPayoutAmount.toFixed(2)}` };
    }

    // Validate balance - Only APPROVED commissions can be requested for payout
    const approvedBalance = await prisma.commission.aggregate({
        where: { userId: userId, status: "APPROVED" },
        _sum: { amount: true }
    });
    
    const balance = Number(approvedBalance._sum.amount) || 0;
    
    if (balance < amount) {
        return { error: `Insufficient approved balance. Available: GHS ${balance.toFixed(2)}` };
    }
    
    if (balance < minimumPayoutAmount) {
        return { error: `Your approved balance is below the minimum payout amount of GHS ${minimumPayoutAmount.toFixed(2)}` };
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Create payout request
            await tx.payoutRequest.create({
                data: {
                    userId: userId,
                    amount,
                    paymentMethod: JSON.stringify(method),
                    status: "PENDING",
                    requestedAt: new Date()
                }
            });

            // Log activity for the user who requested the payout
            await tx.activityLog.create({
                data: {
                    userId: userId,
                    actionType: "PAYOUT_REQUESTED",
                    actionDetails: JSON.stringify({
                        amount: amount,
                        paymentMethod: method.type,
                        approvedBalance: balance
                    })
                }
            });
        });

        // Revalidate based on role
        if ((session.user as any).role === "MANAGER") {
            revalidatePath("/manager/commissions");
        } else if ((session.user as any).role === "AFFILIATE") {
            revalidatePath("/affiliate/commissions");
        }
        
        // Always revalidate admin finance
        revalidatePath("/admin/finance");
        revalidatePath("/admin");
        
        return { success: true };
    } catch(e) {
        console.error("Payout request failed:", e);
        return { error: "Failed to request payout" };
    }
}
