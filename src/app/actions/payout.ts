"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function requestPayout(amount: number, method: any) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const userId = session.user.id;

    // Validate balance - Only APPROVED commissions can be requested for payout
    const approvedBalance = await prisma.commission.aggregate({
        where: { userId: userId, status: "APPROVED" },
        _sum: { amount: true }
    });
    
    const balance = Number(approvedBalance._sum.amount) || 0;
    
    if (balance < amount) {
        return { error: `Insufficient approved balance. Available: GHS ${balance.toFixed(2)}` };
    }

    try {
        await prisma.payoutRequest.create({
            data: {
                userId: userId,
                amount,
                paymentMethod: JSON.stringify(method),
                status: "PENDING",
                requestedAt: new Date()
            }
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
