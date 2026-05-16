"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Role } from "@/lib/types";
import { unstable_noStore as noStore } from "next/cache";
import { selectCommissionIdsForPayout } from "@/lib/payout.mjs";

async function assertFinanceRole() {
  const session = await auth();
  // @ts-ignore
  const role = session?.user?.role;
  if (!session?.user || (role !== Role.FINANCE && role !== Role.ADMIN && role !== Role.OPERATIONS_MANAGER)) {
    throw new Error("Unauthorized");
  }
}

// ─────────────────────────────────────────────────────────────
// Ambassador Tracking Sheet
// ─────────────────────────────────────────────────────────────
export async function getAmbassadorTrackingData(filters?: {
  role?: string;
  managerId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}) {
  noStore();
  await assertFinanceRole();

  const where: any = {
    role: { in: [Role.AFFILIATE, Role.MANAGER] },
  };

  if (filters?.role && filters.role !== "all") where.role = filters.role;
  if (filters?.status && filters.status !== "all") where.status = filters.status;
  if (filters?.managerId && filters.managerId !== "all") where.managerId = filters.managerId;
  if (filters?.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const ambassadors = await prisma.user.findMany({
    where,
    include: {
      commissions: true,
      manager: { select: { id: true, firstName: true, lastName: true, email: true } },
      referrals: {
        select: {
          id: true,
          subscriptions: { select: { plan: { select: { price: true } }, paymentStatus: true } },
        },
      },
      payoutRequests: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = ambassadors.map((user) => {
    const totalCommissions = user.commissions.reduce((sum, c) => sum + Number(c.amount), 0);
    const pendingCommissions = user.commissions
      .filter((c) => c.status === "PENDING" || c.status === "APPROVED")
      .reduce((sum, c) => sum + Number(c.amount), 0);
    const paidCommissions = user.commissions
      .filter((c) => c.status === "PAID")
      .reduce((sum, c) => sum + Number(c.amount), 0);

    // Revenue from recruits (completed subscription payments)
    const revenueGenerated = user.referrals.reduce((sum, ref) => {
      return (
        sum +
        ref.subscriptions
          .filter((s) => s.paymentStatus === "COMPLETED")
          .reduce((s2, sub) => s2 + Number(sub.plan.price), 0)
      );
    }, 0);

    return {
      id: user.id,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      email: user.email,
      role: user.role,
      status: user.status,
      manager: user.manager
        ? `${user.manager.firstName || ""} ${user.manager.lastName || ""}`.trim() || user.manager.email
        : "—",
      managerId: user.managerId,
      customersRecruited: user.referrals.length,
      revenueGenerated,
      totalCommissions,
      outstandingPayouts: pendingCommissions,
      paidOut: paidCommissions,
      joinedAt: user.createdAt,
    };
  });

  // Summary totals
  const summary = {
    totalAmbassadors: rows.length,
    totalCommissionsEarned: rows.reduce((s, r) => s + r.totalCommissions, 0),
    totalOutstanding: rows.reduce((s, r) => s + r.outstandingPayouts, 0),
    totalPaidOut: rows.reduce((s, r) => s + r.paidOut, 0),
  };

  // All managers for the filter dropdown
  const managers = await prisma.user.findMany({
    where: { role: Role.MANAGER },
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  return { rows, summary, managers };
}

// ─────────────────────────────────────────────────────────────
// Payment Tracker
// ─────────────────────────────────────────────────────────────
export async function getPaymentTrackerData(filters?: {
  dateFrom?: string;
  dateTo?: string;
  planId?: string;
  gateway?: string;
  status?: string;
  currency?: string;
  search?: string;
}) {
  noStore();
  await assertFinanceRole();

  const where: any = {};

  if (filters?.status && filters.status !== "all") where.paymentStatus = filters.status;
  if (filters?.gateway && filters.gateway !== "all") where.gateway = filters.gateway;
  if (filters?.currency && filters.currency !== "all") where.currency = filters.currency;
  if (filters?.planId && filters.planId !== "all") where.planId = filters.planId;
  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {};
    if (filters?.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
    if (filters?.dateTo) where.createdAt.lte = new Date(filters.dateTo);
  }
  if (filters?.search) {
    where.customer = {
      OR: [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ],
    };
  }

  const subscriptions = await prisma.subscription.findMany({
    where,
    include: {
      customer: { select: { firstName: true, lastName: true, email: true } },
      childProfile: { select: { name: true } },
      plan: { select: { name: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const plans = await prisma.subscriptionPlan.findMany({ select: { id: true, name: true } });

  // Summary cards
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const completed = subscriptions.filter((s) => s.paymentStatus === "COMPLETED");
  const totalRevenue = completed.reduce((s, sub) => s + Number(sub.plan.price), 0);
  const revenueThisMonth = completed
    .filter((s) => new Date(s.createdAt) >= startOfMonth)
    .reduce((s, sub) => s + Number(sub.plan.price), 0);
  const revenueThisWeek = completed
    .filter((s) => new Date(s.createdAt) >= startOfWeek)
    .reduce((s, sub) => s + Number(sub.plan.price), 0);
  const failedThisMonth = subscriptions.filter(
    (s) => s.paymentStatus === "FAILED" && new Date(s.createdAt) >= startOfMonth
  ).length;

  return {
    transactions: subscriptions.map((s) => ({
      id: s.id,
      date: s.createdAt,
      parentName: `${s.customer.firstName || ""} ${s.customer.lastName || ""}`.trim() || s.customer.email,
      childName: s.childProfile?.name || "—",
      plan: s.plan.name,
      planPrice: Number(s.plan.price),
      amount: Number(s.plan.price),
      currency: (s as any).currency || "GHS",
      gateway: (s as any).gateway || "PAYSTACK",
      paymentStatus: s.paymentStatus,
      paymentReference: s.paymentReference,
      isRecurring: s.autoRenew,
    })),
    plans,
    summary: { totalRevenue, revenueThisMonth, revenueThisWeek, failedThisMonth },
  };
}

// ─────────────────────────────────────────────────────────────
// Daily Signup Tracker
// ─────────────────────────────────────────────────────────────
export async function getDailySignupData(filters?: {
  dateFrom?: string;
  dateTo?: string;
  planId?: string;
  source?: string;
  ambassadorId?: string;
}) {
  noStore();
  await assertFinanceRole();

  const where: any = { role: { in: [Role.PARENT, Role.CUSTOMER] } };

  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {};
    if (filters?.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
    if (filters?.dateTo) where.createdAt.lte = new Date(filters.dateTo);
  }
  if (filters?.source === "organic") where.referredById = null;
  if (filters?.source === "referred") where.referredById = { not: null };
  if (filters?.ambassadorId && filters.ambassadorId !== "all") {
    where.referredById = filters.ambassadorId;
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      referredBy: { select: { firstName: true, lastName: true, email: true, role: true } },
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { plan: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Build daily chart data
  const dayMap: Record<string, { date: string; total: number; referred: number; organic: number }> = {};
  users.forEach((u) => {
    const day = new Date(u.createdAt).toISOString().slice(0, 10);
    if (!dayMap[day]) dayMap[day] = { date: day, total: 0, referred: 0, organic: 0 };
    dayMap[day].total++;
    if (u.referredById) dayMap[day].referred++;
    else dayMap[day].organic++;
  });
  const chartData = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const allParents = await prisma.user.findMany({
    where: { role: { in: [Role.PARENT, Role.CUSTOMER] } },
    select: { createdAt: true, referredById: true },
  });

  const totalToday = allParents.filter((u) => new Date(u.createdAt) >= startOfToday).length;
  const totalThisWeek = allParents.filter((u) => new Date(u.createdAt) >= startOfWeek).length;
  const totalThisMonth = allParents.filter((u) => new Date(u.createdAt) >= startOfMonth).length;
  const referredThisMonth = allParents.filter(
    (u) => new Date(u.createdAt) >= startOfMonth && u.referredById
  ).length;
  const ambassadorPct = totalThisMonth > 0 ? Math.round((referredThisMonth / totalThisMonth) * 100) : 0;

  const ambassadors = await prisma.user.findMany({
    where: { role: { in: [Role.AFFILIATE, Role.MANAGER] } },
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  return {
    rows: users.map((u) => ({
      id: u.id,
      date: u.createdAt,
      parentName: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
      source: u.referredById ? "Referred" : "Organic",
      ambassador: u.referredBy
        ? `${u.referredBy.firstName || ""} ${u.referredBy.lastName || ""}`.trim() || u.referredBy.email
        : "—",
      plan: u.subscriptions[0]?.plan?.name || "No plan",
      paymentStatus: u.subscriptions[0]?.paymentStatus || "—",
    })),
    chartData,
    ambassadors,
    summary: { totalToday, totalThisWeek, totalThisMonth, ambassadorPct },
  };
}

// ─────────────────────────────────────────────────────────────
// Payout Requests
// ─────────────────────────────────────────────────────────────
export async function getFinancePayoutRequests() {
  noStore();
  await assertFinanceRole();

  const requests = await prisma.payoutRequest.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, email: true, role: true } },
    },
    orderBy: { requestedAt: "desc" },
  });

  const summary = {
    totalPending: requests.filter((r) => r.status === "PENDING").length,
    totalApproved: requests.filter((r) => r.status === "APPROVED").length,
    totalPaid: requests.filter((r) => r.status === "PAID").length,
    amountPending: requests
      .filter((r) => r.status === "PENDING")
      .reduce((s, r) => s + Number(r.amount), 0),
  };

  return { requests, summary };
}

export async function financeApprovePayout(payoutRequestId: string) {
  await assertFinanceRole();
  await prisma.payoutRequest.update({
    where: { id: payoutRequestId },
    data: { status: "APPROVED" },
  });
  revalidatePath("/finance/payouts");
  return { success: true };
}

export async function financeMarkPayoutPaid(payoutRequestId: string, adminNotes?: string) {
  await assertFinanceRole();

  const payout = await prisma.payoutRequest.findUnique({ where: { id: payoutRequestId } });
  if (!payout) return { error: "Payout not found" };
  if (payout.status !== "APPROVED") {
    return { error: "Only approved payout requests can be marked as paid" };
  }

  const approvedCommissions = await prisma.commission.findMany({
    where: { userId: payout.userId, status: "APPROVED" },
    orderBy: { createdAt: "asc" },
    select: { id: true, amount: true },
  });

  const commissionsToMarkPaid = selectCommissionIdsForPayout(
    Number(payout.amount),
    approvedCommissions
  );
  const paidAt = new Date();

  await prisma.$transaction([
    prisma.payoutRequest.update({
      where: { id: payoutRequestId },
      data: { status: "PAID", processedAt: paidAt, adminNotes: adminNotes || null },
    }),
    ...(commissionsToMarkPaid.length > 0
      ? [
          prisma.commission.updateMany({
            where: { id: { in: commissionsToMarkPaid } },
            data: { status: "PAID", paidAt },
          }),
        ]
      : []),
  ]);

  revalidatePath("/finance/payouts");
  revalidatePath("/finance");
  return { success: true };
}

export async function financeRejectPayout(payoutRequestId: string, adminNotes?: string) {
  await assertFinanceRole();
  await prisma.payoutRequest.update({
    where: { id: payoutRequestId },
    data: { status: "REJECTED", processedAt: new Date(), adminNotes: adminNotes || null },
  });
  revalidatePath("/finance/payouts");
  return { success: true };
}
