"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function getManagerStats() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== Role.MANAGER) {
    return null;
  }

  const userId = session.user.id;

  // Total Team Members (Affiliates managed by this user)
  const teamCount = await prisma.user.count({
    where: { managerId: userId, role: Role.AFFILIATE },
  });

  // Total Customers Referred (by team)
  // Customers referred by any affiliate in this team
  const affiliates = await prisma.user.findMany({
    where: { managerId: userId },
    select: { id: true },
  });
  const affiliateIds = affiliates.map((a) => a.id);
  
  const customersCount = await prisma.user.count({
    where: { referredById: { in: affiliateIds } },
  });

  // Earnings
  // For simplicity, we sum 'paid' commissions for total, 'pending' for pending.
  const totalEarnings = await prisma.commission.aggregate({
    where: { userId: userId, status: "PAID" },
    _sum: { amount: true },
  });

  const pendingPayout = await prisma.commission.aggregate({
    where: { userId: userId, status: "APPROVED" }, // Approved but not Paid
    _sum: { amount: true },
  });

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const monthEarnings = await prisma.commission.aggregate({
    where: { 
        userId: userId, 
        createdAt: { gte: thisMonthStart }
    },
    _sum: { amount: true },
  });

  return {
    teamCount,
    customersCount,
    totalEarnings: totalEarnings._sum.amount || 0,
    pendingPayout: pendingPayout._sum.amount || 0,
    monthEarnings: monthEarnings._sum.amount || 0,
  };
}

export async function getTeamMembers() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const members = await prisma.user.findMany({
        where: { managerId: session.user.id, role: Role.AFFILIATE },
        include: {
            _count: {
                select: { referrals: true } // Customers referred
            }
        }
    });
    
    // We might want to calculate earnings per affiliate if commissions table allows
    // For now, return basic info
    return members.map(m => ({
        ...m,
        referralsCount: m._count.referrals
    }));
}

export async function getManagerCommissions() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return await prisma.commission.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });
}

export async function requestPayout(amount: number, method: any) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    // Validate balance
    const approvedBalance = await prisma.commission.aggregate({
        where: { userId: session.user.id, status: "APPROVED" },
        _sum: { amount: true }
    });
    
    if ((approvedBalance._sum.amount || 0) < amount) {
        return { error: "Insufficient approved balance" };
    }

    try {
        await prisma.payoutRequest.create({
            data: {
                userId: session.user.id,
                amount,
                paymentMethod: JSON.stringify(method),
                status: "PENDING",
                requestedAt: new Date()
            }
        });
        revalidatePath("/manager/commissions");
        return { success: true };
    } catch(e) {
        console.error("Payout request failed:", e);
        return { error: "Failed to request payout" };
    }
}
