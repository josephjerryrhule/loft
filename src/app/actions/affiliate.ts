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

    const userId = session.user.id;
    const activities: any[] = [];

    // Get recent commissions earned
    const commissions = await prisma.commission.findMany({
        where: { userId: userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
            user: {
                select: { firstName: true, lastName: true }
            }
        }
    });

    commissions.forEach((comm: any) => {
        let description = "";
        if (comm.sourceType === "SUBSCRIPTION") {
            description = `Earned GHS ${Number(comm.amount).toFixed(2)} from subscription commission`;
        } else if (comm.sourceType === "ORDER") {
            description = `Earned GHS ${Number(comm.amount).toFixed(2)} from product order commission`;
        } else if (comm.sourceType === "SIGNUP") {
            description = `Earned GHS ${Number(comm.amount).toFixed(2)} signup bonus`;
        } else {
            description = `Earned GHS ${Number(comm.amount).toFixed(2)} commission`;
        }

        activities.push({
            id: `comm-${comm.id}`,
            action: "Commission Earned",
            description: description,
            timestamp: comm.createdAt,
            status: comm.status
        });
    });

    // Get customers referred by this affiliate
    const referredCustomers = await prisma.user.findMany({
        where: { referredById: userId, role: "CUSTOMER" },
        select: { id: true, firstName: true, lastName: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5
    });

    referredCustomers.forEach((customer: any) => {
        activities.push({
            id: `ref-${customer.id}`,
            action: "New Referral",
            description: `${customer.firstName || ""} ${customer.lastName || ""} signed up using your link`,
            timestamp: customer.createdAt,
            status: "COMPLETED"
        });
    });

    // Get subscriptions from referred customers
    const referredCustomerIds = referredCustomers.map(c => c.id);
    const subscriptions = await prisma.subscription.findMany({
        where: { customerId: { in: referredCustomerIds } },
        include: {
            customer: { select: { firstName: true, lastName: true } },
            plan: { select: { name: true, price: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 5
    });

    subscriptions.forEach((sub: any) => {
        activities.push({
            id: `sub-${sub.id}`,
            action: "Customer Subscription",
            description: `${sub.customer.firstName || ""} ${sub.customer.lastName || ""} subscribed to ${sub.plan.name} (GHS ${Number(sub.plan.price).toFixed(2)})`,
            timestamp: sub.createdAt,
            status: sub.status
        });
    });

    // Get orders from referred customers
    const orders = await prisma.order.findMany({
        where: { referredById: userId },
        include: {
            customer: { select: { firstName: true, lastName: true } },
            product: { select: { title: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 5
    });

    orders.forEach((order: any) => {
        activities.push({
            id: `order-${order.id}`,
            action: "Customer Purchase",
            description: `${order.customer.firstName || ""} ${order.customer.lastName || ""} purchased ${order.product.title} (GHS ${Number(order.totalAmount).toFixed(2)})`,
            timestamp: order.createdAt,
            status: order.status
        });
    });

    // Sort all activities by timestamp (newest first) and take top 15
    return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 15);
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

export async function getAffiliateCommissions(page = 1, pageSize = 10) {
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
        commissions: commissions.map((comm: any) => ({
            ...comm,
            amount: Number(comm.amount)
        })),
        total,
        totalPages: Math.ceil(total / pageSize)
    };
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
