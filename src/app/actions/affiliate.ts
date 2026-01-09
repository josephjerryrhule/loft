"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/types";

export async function getAffiliateStats() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  // Total Referrals
  const referralsCount = await prisma.user.count({
    where: { referredById: userId },
  });

  // Earnings - Total = all commissions
  const totalEarnings = await prisma.commission.aggregate({
    where: { userId: userId },
    _sum: { amount: true },
  });

  // Pending balance = PENDING or APPROVED (not yet paid out)
  const pendingBalance = await prisma.commission.aggregate({
    where: { userId: userId, status: { in: ["PENDING", "APPROVED"] } },
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
    referralsCount,
    totalEarnings: Number(totalEarnings._sum.amount) || 0,
    pendingBalance: Number(pendingBalance._sum.amount) || 0,
    monthEarnings: Number(monthEarnings._sum.amount) || 0,
  };
}

export async function getRecentAffiliateActivities() {
    const session = await auth();
    if (!session?.user?.id) return [];

    // Get customers referred by this affiliate
    const referredCustomers = await prisma.user.findMany({
        where: { referredById: session.user.id },
        select: { id: true, firstName: true, lastName: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5
    });

    // Get recent commissions earned
    const recentCommissions = await prisma.commission.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 5
    });

    // Build activity list
    const activities: { id: string; action: string; description: string; timestamp: Date; status: string }[] = [];

    // Add customer signups
    referredCustomers.forEach((customer: { id: string; firstName: string | null; lastName: string | null; createdAt: Date }) => {
        activities.push({
            id: `signup-${customer.id}`,
            action: "Customer Signup",
            description: `${customer.firstName || ""} ${customer.lastName || ""} joined via your link`,
            timestamp: customer.createdAt,
            status: "completed"
        });
    });

    // Add commissions
    recentCommissions.forEach((comm: { id: string; sourceType: string; amount: any; createdAt: Date; status: string }) => {
        let action = "Commission";
        if (comm.sourceType === "SIGNUP") action = "Signup Bonus";
        else if (comm.sourceType === "PRODUCT") action = "Sale Commission";
        else if (comm.sourceType === "SUBSCRIPTION") action = "Subscription Commission";
        
        activities.push({
            id: `comm-${comm.id}`,
            action,
            description: `Earned GHS ${Number(comm.amount).toFixed(2)}`,
            timestamp: comm.createdAt,
            status: comm.status === "PAID" ? "completed" : "pending"
        });
    });

    // Sort by timestamp and return top 10
    return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
}

export async function getAffiliateMonthlyEarningsData() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const earnings = await prisma.commission.aggregate({
            where: {
                userId: session.user.id,
                createdAt: {
                    gte: date,
                    lte: endDate
                }
            },
            _sum: { amount: true }
        });

        months.push({
            month: date.toLocaleString('default', { month: 'short' }),
            earnings: Number(earnings._sum.amount) || 0
        });
    }

    return months;
}
