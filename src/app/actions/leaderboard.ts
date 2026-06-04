"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/types";

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar: string | null;
  role: string;
  ambassadorId: string | null;
  salesCount: number;
  // Total referred customers/parents, paid or free. Visible to everyone so
  // ambassadors who recruit free-plan users still see their effort counted.
  referralsCount: number;
  // Subset of referralsCount that have at least one paid subscription —
  // used as a primary tiebreaker and shown as a separate badge.
  paidReferralsCount: number;
  monthlySubs: number;
  quarterlySubs: number;
  semiAnnualSubs: number;
  yearlySubs: number;
  otherSubs: number;
  productSales: number;
  revenue?: number;
  earnings?: number;
  status: string;
  joinDate: Date;
  managerName?: string;
  teamLeaderName?: string;
}

export async function getLeaderboardData(filters: {
  search?: string;
  role?: string;
  status?: string;
  dateRange?: { from: Date; to: Date };
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const viewerRole = (session.user as any).role;
  const viewerId = session.user.id;

  // Default to the current calendar month if no date range is specified
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const range = filters.dateRange || { from: startOfMonth, to: endOfMonth };

  // 1. Fetch only Team Leaders and Affiliates
  const ambassadors = await prisma.user.findMany({
    where: {
      role: { in: [Role.AFFILIATE, Role.TEAM_LEADER] },
      status: filters.status || undefined,
      ...(filters.role && { role: filters.role }),
      ...(filters.search && {
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { ambassadorId: { contains: filters.search, mode: 'insensitive' } },
        ]
      }),
      ...(filters.dateRange && {
        createdAt: {
          gte: filters.dateRange.from,
          lte: filters.dateRange.to
        }
      })
    },
    include: {
      manager: { select: { firstName: true, lastName: true } },
      teamLeader: { select: { firstName: true, lastName: true } },
      referrals: {
        where: {
          role: { in: [Role.PARENT, Role.CUSTOMER] }
        },
        include: {
          subscriptions: {
            where: {
              paymentStatus: "COMPLETED",
              createdAt: {
                gte: range.from,
                lte: range.to
              }
            },
            include: { plan: true }
          }
        }
      },
      // We also need to count sales from direct referrals that might be stored in the referredOrders
      referredOrders: {
          where: {
              paymentStatus: { in: ["PAID", "COMPLETED"] },
              createdAt: {
                gte: range.from,
                lte: range.to
              }
          }
      },
      commissions: {
          where: {
              createdAt: {
                gte: range.from,
                lte: range.to
              }
          }
      }
    }
  });

  // 2. Process data and calculate stats
  let leaderboard: LeaderboardEntry[] = ambassadors.map(user => {
    // Sales count = paid subscriptions from referred users + product sales
    const subscriptionSales = user.referrals.reduce((sum, referral) => sum + referral.subscriptions.length, 0);
    const productSales = user.referredOrders.length;
    const salesCount = subscriptionSales + productSales;

    const referralsCount = user.referrals.filter(r => r.createdAt >= range.from && r.createdAt <= range.to).length;
    // A referral counts as "paid" if they hold at least one completed
    // subscription. Free-plan signups still appear in referralsCount, but
    // don't inflate this metric — so the leaderboard ordering can't be
    // gamed by mass-creating no-revenue accounts.
    const paidReferralsCount = user.referrals.filter(r => r.subscriptions.length > 0).length;
    let monthlySubs = 0;
    let quarterlySubs = 0;
    let semiAnnualSubs = 0;
    let yearlySubs = 0;
    let otherSubs = 0;

    user.referrals.forEach(referral => {
      referral.subscriptions.forEach(sub => {
        const days = sub.plan.durationDays;
        if (days >= 25 && days <= 35) monthlySubs++;
        else if (days >= 80 && days <= 100) quarterlySubs++;
        else if (days >= 170 && days <= 190) semiAnnualSubs++;
        else if (days >= 360 && days <= 370) yearlySubs++;
        else otherSubs++;
      });
    });

    // Revenue calculation
    const subscriptionRevenue = user.referrals.reduce((sum, referral) => {
      return sum + referral.subscriptions.reduce((subSum, sub) => subSum + Number(sub.plan.price), 0);
    }, 0);
    const productRevenue = user.referredOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const totalRevenue = subscriptionRevenue + productRevenue;

    // Earnings calculation
    const totalEarnings = user.commissions.reduce((sum, comm) => sum + Number(comm.amount), 0);

    const entry: LeaderboardEntry & { _revenue: number } = {
      id: user.id,
      rank: 0, // Assigned later
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      avatar: user.profilePictureUrl,
      role: user.role,
      ambassadorId: user.ambassadorId,
      salesCount,
      referralsCount,
      paidReferralsCount,
      monthlySubs,
      quarterlySubs,
      semiAnnualSubs,
      yearlySubs,
      otherSubs,
      productSales,
      status: user.status,
      joinDate: user.createdAt,
      managerName: user.manager ? `${user.manager.firstName || ""} ${user.manager.lastName || ""}`.trim() : undefined,
      teamLeaderName: user.teamLeader ? `${user.teamLeader.firstName || ""} ${user.teamLeader.lastName || ""}`.trim() : undefined,
      _revenue: totalRevenue, // private — used for tiebreaker sort, never serialized
    };

    // Apply visibility rules for revenue and earnings
    const canViewRevenue = 
      viewerRole === Role.ADMIN ||
      viewerRole === Role.FINANCE ||
      viewerRole === Role.OPERATIONS_MANAGER || 
      (viewerRole === Role.MANAGER && (user.managerId === viewerId || user.id === viewerId)) ||
      (viewerId === user.id);

    const canViewEarnings = 
      viewerRole === Role.ADMIN ||
      viewerRole === Role.FINANCE ||
      viewerRole === Role.OPERATIONS_MANAGER || 
      (viewerRole === Role.MANAGER && (user.managerId === viewerId || user.id === viewerId)) ||
      (viewerId === user.id);

    if (canViewRevenue) {
      entry.revenue = totalRevenue;
    }
    if (canViewEarnings) {
      entry.earnings = totalEarnings;
    }

    return entry;
  });

  // 3. Multi-key ranking. Primary signal is paid sales so free-plan
  //    recruitment doesn't shove someone to the top. Tiebreakers cascade:
  //    revenue → paid referrals → total referrals → earliest joinDate
  //    (rewards tenure when two ambassadors are otherwise identical).
  type Scored = LeaderboardEntry & { _revenue: number };
  (leaderboard as Scored[]).sort((a, b) => {
    if (b.salesCount !== a.salesCount) return b.salesCount - a.salesCount;
    if (b._revenue !== a._revenue) return b._revenue - a._revenue;
    if (b.paidReferralsCount !== a.paidReferralsCount) return b.paidReferralsCount - a.paidReferralsCount;
    if (b.referralsCount !== a.referralsCount) return b.referralsCount - a.referralsCount;
    return new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
  });

  // Strip the private _revenue tiebreaker before returning so it never
  // ships to a client where the viewer isn't permitted to see revenue.
  leaderboard = (leaderboard as Scored[]).map(({ _revenue, ...entry }, index) => ({
    ...entry,
    rank: index + 1,
  }));

  return leaderboard;
}

export async function getAmbassadorPerformance(userId: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const viewerRole = (session.user as any).role;
    const viewerId = session.user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            referrals: {
                where: { role: { in: [Role.PARENT, Role.CUSTOMER] } },
                include: {
                    subscriptions: {
                        where: { paymentStatus: "COMPLETED" },
                        include: { plan: true }
                    }
                }
            },
            referredOrders: {
                where: { paymentStatus: { in: ["PAID", "COMPLETED"] } },
                include: { product: true }
            },
            commissions: {
                orderBy: { createdAt: 'desc' }
            },
            manager: true,
            teamLeader: true,
            teamMembers: {
                select: { id: true, firstName: true, lastName: true, role: true, ambassadorId: true }
            },
            affiliates: {
                select: { id: true, firstName: true, lastName: true, role: true, ambassadorId: true }
            }
        }
    });

    if (!user) throw new Error("User not found");

    // Check visibility permission
    const isSelf = viewerId === userId;
    const isOpsManager = viewerRole === Role.OPERATIONS_MANAGER;
    const isAdmin = viewerRole === Role.ADMIN;
    const isFinance = viewerRole === Role.FINANCE;
    const isManagerOfUser = viewerRole === Role.MANAGER && user.managerId === viewerId;
    const isTeamLeaderOfUser = viewerRole === Role.TEAM_LEADER && user.teamLeaderId === viewerId;

    // Financial visibility: managers see earnings of their direct team so
    // they can coach payouts — same scope they already see on /manager.
    const canViewFinancials = isSelf || isOpsManager || isAdmin || isFinance || isManagerOfUser;
    const canViewRevenue = canViewFinancials;

    // Calculate metrics
    const subscriptionSales = user.referrals.reduce((sum, referral) => sum + referral.subscriptions.length, 0);
    const productSales = user.referredOrders.length;
    const totalSales = subscriptionSales + productSales;

    const subscriptionRevenue = user.referrals.reduce((sum, referral) => {
        return sum + referral.subscriptions.reduce((subSum, sub) => subSum + Number(sub.plan.price), 0);
    }, 0);
    const productRevenue = user.referredOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const totalRevenue = subscriptionRevenue + productRevenue;

    const personalEarnings = user.commissions
        .filter(c => !c.sourceType.startsWith("OVERRIDE"))
        .reduce((sum, c) => sum + Number(c.amount), 0);
    
    const overrideEarnings = user.commissions
        .filter(c => c.sourceType.startsWith("OVERRIDE"))
        .reduce((sum, c) => sum + Number(c.amount), 0);

    const monthlyStats = calculateMonthlyStats(user.commissions);

    return {
        user: {
            id: user.id,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            email: user.email,
            role: user.role,
            ambassadorId: user.ambassadorId,
            joinDate: user.createdAt,
            status: user.status,
            avatar: user.profilePictureUrl,
            manager: user.manager ? `${user.manager.firstName} ${user.manager.lastName}` : null,
            teamLeader: user.teamLeader ? `${user.teamLeader.firstName} ${user.teamLeader.lastName}` : null,
        },
        metrics: {
            totalSales,
            subscriptionSales,
            productSales,
            totalRevenue: canViewRevenue ? totalRevenue : null,
            personalEarnings: canViewFinancials ? personalEarnings : null,
            overrideEarnings: canViewFinancials ? overrideEarnings : null,
            totalEarnings: canViewFinancials ? (personalEarnings + overrideEarnings) : null,
        },
        monthlyStats,
        recentActivity: user.commissions.slice(0, 10).map(c => ({
            id: c.id,
            amount: Number(c.amount),
            type: c.sourceType,
            date: c.createdAt,
            status: c.status
        })),
        team: (user.role === Role.MANAGER || user.role === Role.TEAM_LEADER) ? {
            members: [...user.teamMembers, ...user.affiliates]
        } : null
    };
}

function calculateMonthlyStats(commissions: any[]) {
    const months: Record<string, { earnings: number; sales: number }> = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        months[key] = { earnings: 0, sales: 0 };
    }

    commissions.forEach(c => {
        const d = new Date(c.createdAt);
        const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (months[key]) {
            months[key].earnings += Number(c.amount);
            months[key].sales += 1;
        }
    });

    return Object.entries(months).map(([month, data]) => ({
        month,
        ...data
    }));
}
