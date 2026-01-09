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
  // Total earnings = All commissions (paid + pending + approved)
  const totalEarnings = await prisma.commission.aggregate({
    where: { userId: userId },
    _sum: { amount: true },
  });

  // Available for payout = PENDING or APPROVED (not yet paid out)
  const pendingPayout = await prisma.commission.aggregate({
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

  // Team earnings = Total commissions earned by affiliates under this manager
  const teamEarnings = await prisma.commission.aggregate({
    where: { userId: { in: affiliateIds } },
    _sum: { amount: true },
  });

  return {
    teamCount,
    customersCount,
    totalEarnings: Number(totalEarnings._sum.amount) || 0,
    pendingPayout: Number(pendingPayout._sum.amount) || 0,
    monthEarnings: Number(monthEarnings._sum.amount) || 0,
    teamEarnings: Number(teamEarnings._sum.amount) || 0,
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

export async function getRecentManagerActivities() {
    const session = await auth();
    if (!session?.user?.id) return [];

    // Get team member IDs (affiliates managed by this manager)
    const teamMembers = await prisma.user.findMany({
        where: { managerId: session.user.id },
        select: { id: true, firstName: true, lastName: true }
    });
    const teamIds = teamMembers.map((m: { id: string }) => m.id);

    // Get customers referred by team or directly by manager
    const referredCustomers = await prisma.user.findMany({
        where: {
            OR: [
                { referredById: session.user.id },
                { referredById: { in: teamIds } }
            ]
        },
        select: { id: true, firstName: true, lastName: true, createdAt: true, referredById: true },
        orderBy: { createdAt: "desc" },
        take: 5
    });

    // Get recent commissions earned by manager
    const managerCommissions = await prisma.commission.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 5
    });

    // Get recent commissions earned by team members
    const teamCommissions = await prisma.commission.findMany({
        where: { userId: { in: teamIds } },
        include: { user: true },
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
            description: `${customer.firstName || ""} ${customer.lastName || ""} joined via referral`,
            timestamp: customer.createdAt,
            status: "completed"
        });
    });

    // Add manager's commissions
    managerCommissions.forEach((comm: { id: string; sourceType: string; amount: any; createdAt: Date; status: string }) => {
        let action = "Your Commission";
        if (comm.sourceType === "SIGNUP") action = "Your Signup Commission";
        else if (comm.sourceType === "PRODUCT") action = "Your Sale Commission";
        else if (comm.sourceType === "SUBSCRIPTION") action = "Your Subscription Commission";
        
        activities.push({
            id: `comm-${comm.id}`,
            action,
            description: `Earned GHS ${Number(comm.amount).toFixed(2)}`,
            timestamp: comm.createdAt,
            status: comm.status === "PAID" ? "completed" : "pending"
        });
    });

    // Add team members' commissions
    teamCommissions.forEach((comm: any) => {
        let action = "Team Commission";
        if (comm.sourceType === "SIGNUP") action = "Team Signup Bonus";
        else if (comm.sourceType === "PRODUCT") action = "Team Sale Commission";
        else if (comm.sourceType === "SUBSCRIPTION") action = "Team Subscription Commission";
        
        const memberName = comm.user ? `${comm.user.firstName || ""} ${comm.user.lastName || ""}`.trim() : "Team Member";
        
        activities.push({
            id: `team-comm-${comm.id}`,
            action,
            description: `${memberName} earned GHS ${Number(comm.amount).toFixed(2)}`,
            timestamp: comm.createdAt,
            status: comm.status === "PAID" ? "completed" : "pending"
        });
    });

    // Sort by timestamp and return top 15
    return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 15);
}

export async function getMonthlyEarningsData() {
    const session = await auth();
    if (!session?.user?.id) return [];

    // Generate last 6 months of data
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

