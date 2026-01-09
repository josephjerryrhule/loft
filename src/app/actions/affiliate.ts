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

  // Pending balance = PENDING only (awaiting admin approval)
  const pendingBalance = await prisma.commission.aggregate({
    where: { userId: userId, status: "PENDING" },
    _sum: { amount: true },
  });

  // Approved balance = APPROVED (ready for payout, approved by admin)
  const approvedBalance = await prisma.commission.aggregate({
    where: { userId: userId, status: "APPROVED" },
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
    approvedBalance: Number(approvedBalance._sum.amount) || 0,
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

    return referredCustomers.map((customer: any) => ({
        id: customer.id,
        actionType: "REFERRAL",
        description: `New customer referral: ${customer.firstName} ${customer.lastName}`,
        createdAt: customer.createdAt,
    }));
}

export async function getAffiliateMonthlyEarningsData() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const userId = session.user.id;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const commissions = await prisma.commission.findMany({
        where: {
            userId: userId,
            createdAt: { gte: sixMonthsAgo }
        },
        orderBy: { createdAt: "asc" }
    });

    const monthlyData: { [key: string]: number } = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Initialize last 6 months
    for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthLabel = months[d.getMonth()];
        monthlyData[monthLabel] = 0;
    }

    commissions.forEach((comm: any) => {
        const date = new Date(comm.createdAt);
        const monthLabel = months[date.getMonth()];
        if (monthlyData[monthLabel] !== undefined) {
            monthlyData[monthLabel] += Number(comm.amount);
        }
    });

    return Object.entries(monthlyData)
        .map(([month, earnings]) => ({ month, earnings: Number(earnings.toFixed(2)) }))
        .reverse();
}

export async function getAffiliateCommissions() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const commissions = await prisma.commission.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" }
    });

    return commissions.map((comm: any) => ({
        ...comm,
        amount: Number(comm.amount)
    }));
}

export async function getAffiliateLinks() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { inviteCode: true }
    });

    if (!user?.inviteCode) return null;

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    return {
        referralCode: user.inviteCode,
        customerLink: `${baseUrl}/join/customer/${user.inviteCode}`,
        affiliateLink: `${baseUrl}/join/affiliate/${user.inviteCode}`
    };
}
