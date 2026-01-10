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

  // Approved balance = APPROVED only (ready for payout)
  const approvedBalance = await prisma.commission.aggregate({
    where: { userId: userId, status: "APPROVED" },
    _sum: { amount: true },
  });
  
  // Pending balance = PENDING only (awaiting admin approval)
  const pendingBalance = await prisma.commission.aggregate({
    where: { userId: userId, status: "PENDING" },
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
    approvedBalance: Number(approvedBalance._sum.amount) || 0,
    pendingBalance: Number(pendingBalance._sum.amount) || 0,
    monthEarnings: Number(monthEarnings._sum.amount) || 0,
    teamEarnings: Number(teamEarnings._sum.amount) || 0,
  };
}

export async function getTeamMembers(page = 1, pageSize = 10) {
    const session = await auth();
    if (!session?.user?.id) return { members: [], total: 0, totalPages: 0 };

    const skip = (page - 1) * pageSize;

    const [members, total] = await Promise.all([
        prisma.user.findMany({
            where: { managerId: session.user.id, role: Role.AFFILIATE },
            include: {
                _count: {
                    select: { referrals: true }
                }
            },
            skip,
            take: pageSize,
            orderBy: { createdAt: "desc" }
        }),
        prisma.user.count({
            where: { managerId: session.user.id, role: Role.AFFILIATE }
        })
    ]);
    
    return {
        members: members.map(m => ({
            ...m,
            referralsCount: m._count.referrals
        })),
        total,
        totalPages: Math.ceil(total / pageSize)
    };
}

export async function getManagerCommissions(page = 1, pageSize = 10) {
    const session = await auth();
    if (!session?.user?.id) return { commissions: [], total: 0, totalPages: 0 };

    const skip = (page - 1) * pageSize;

    const [commissions, total] = await Promise.all([
        prisma.commission.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            skip,
            take: pageSize
        }),
        prisma.commission.count({
            where: { userId: session.user.id }
        })
    ]);

    return { 
        commissions, 
        total, 
        totalPages: Math.ceil(total / pageSize) 
    };
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
        take: 25
    });

    const customerIds = referredCustomers.map(c => c.id);

    // Get recent commissions earned by manager
    const managerCommissions = await prisma.commission.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 25
    });

    // Get recent commissions earned by team members
    const teamCommissions = await prisma.commission.findMany({
        where: { userId: { in: teamIds } },
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 25
    });

    // Get customer subscriptions from team's referred customers
    const customerSubscriptions = await prisma.subscription.findMany({
        where: { customerId: { in: customerIds } },
        include: {
            customer: { select: { firstName: true, lastName: true, referredById: true } },
            plan: { select: { name: true, price: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 25
    });

    // Get customer purchases from team's referred customers
    const customerOrders = await prisma.order.findMany({
        where: { customerId: { in: customerIds } },
        include: {
            customer: { select: { firstName: true, lastName: true } },
            product: { select: { title: true, price: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 25
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
            status: "COMPLETED"
        });
    });

    // Add customer subscriptions
    customerSubscriptions.forEach((sub: any) => {
        const customerName = `${sub.customer.firstName || ""} ${sub.customer.lastName || ""}`.trim() || "Customer";
        activities.push({
            id: `customer-sub-${sub.id}`,
            action: "Customer Subscription",
            description: `${customerName} subscribed to ${sub.plan.name} (GHS ${Number(sub.plan.price).toFixed(2)})`,
            timestamp: sub.createdAt,
            status: sub.status
        });
    });

    // Add customer purchases
    customerOrders.forEach((order: any) => {
        const customerName = `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim() || "Customer";
        activities.push({
            id: `customer-order-${order.id}`,
            action: "Customer Purchase",
            description: `${customerName} purchased ${order.product.title} (GHS ${Number(order.totalAmount).toFixed(2)})`,
            timestamp: order.createdAt,
            status: order.status
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
            status: comm.status
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
            status: comm.status
        });
    });

    // Sort by timestamp and return top 50
    return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50);
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

