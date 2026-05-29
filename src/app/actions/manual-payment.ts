"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

// ─── Helpers ──────────────────────────────────────────────────

async function requireFinanceOrAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const allowedRoles = ["ADMIN", "FINANCE", "OPERATIONS_MANAGER"];
  if (!allowedRoles.includes(session.user.role ?? "")) {
    throw new Error("Unauthorized: insufficient role");
  }
  return session.user;
}

// ─── Get Outstanding Commissions ──────────────────────────────

export async function getOutstandingCommissions(userId: string) {
  await requireFinanceOrAdmin();

  const commissions = await prisma.commission.findMany({
    where: {
      userId,
      status: { in: ["PENDING", "APPROVED"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      sourceType: true,
      sourceId: true,
      amount: true,
      currency: true,
      status: true,
      createdAt: true,
    },
  });

  return commissions.map((c) => ({
    ...c,
    amount: Number(c.amount),
  }));
}

// ─── Search Recipients ────────────────────────────────────────

export async function searchRecipients(query: string) {
  await requireFinanceOrAdmin();

  if (!query || query.trim().length < 2) return [];

  const users = await prisma.user.findMany({
    where: {
      role: {
        in: [
          "AFFILIATE",
          "MANAGER",
          "TEAM_LEADER",
          "OPERATIONS_MANAGER",
          "ADMIN",
        ],
      },
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { ambassadorId: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 20,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      ambassadorId: true,
    },
  });

  return users;
}

// ─── Create Manual Payment ────────────────────────────────────

interface CreateManualPaymentInput {
  recipientId: string;
  paymentType: string;
  totalAmount: number;
  currency?: string;
  reason?: string;
  paymentMethod?: string;
  paymentRef?: string;
  commissionIds: string[];
}

export async function createManualPayment(input: CreateManualPaymentInput) {
  const user = await requireFinanceOrAdmin();

  const {
    recipientId,
    paymentType,
    totalAmount,
    currency = "GHS",
    reason,
    paymentMethod,
    paymentRef,
    commissionIds,
  } = input;

  // Validate
  if (totalAmount <= 0) {
    return { error: "Total amount must be greater than 0" };
  }

  const validTypes = [
    "COMPETITION_PRIZE",
    "BONUS",
    "INCENTIVE",
    "CORRECTION",
    "OTHER",
  ];
  if (!validTypes.includes(paymentType)) {
    return { error: "Invalid payment type" };
  }

  // Verify recipient exists
  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  if (!recipient) {
    return { error: "Recipient not found" };
  }

  // If commissions selected, validate they belong to recipient and are outstanding
  let allocatedAmount = 0;
  let commissionsToAllocate: { id: string; amount: Decimal }[] = [];

  if (commissionIds.length > 0) {
    commissionsToAllocate = await prisma.commission.findMany({
      where: {
        id: { in: commissionIds },
        userId: recipientId,
        status: { in: ["PENDING", "APPROVED"] },
      },
      select: { id: true, amount: true },
    });

    if (commissionsToAllocate.length !== commissionIds.length) {
      return {
        error:
          "Some commissions are invalid, already paid, or don't belong to this recipient",
      };
    }

    allocatedAmount = commissionsToAllocate.reduce(
      (sum, c) => sum + Number(c.amount),
      0,
    );

    if (allocatedAmount > totalAmount) {
      return {
        error: `Allocated amount (${allocatedAmount.toFixed(2)}) exceeds total payment (${totalAmount.toFixed(2)})`,
      };
    }
  }

  const bonusAmount = totalAmount - allocatedAmount;

  // Execute in a transaction
  try {
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the manual payment record
      const payment = await tx.manualPayment.create({
        data: {
          recipientId,
          paymentType,
          totalAmount: new Decimal(totalAmount),
          allocatedAmount: new Decimal(allocatedAmount),
          bonusAmount: new Decimal(bonusAmount),
          currency,
          reason: reason || null,
          paymentMethod: paymentMethod || null,
          paymentRef: paymentRef || null,
          status: "COMPLETED",
          createdById: user.id!,
        },
      });

      // Create allocations and mark commissions as PAID
      for (const commission of commissionsToAllocate) {
        await tx.manualPaymentAllocation.create({
          data: {
            manualPaymentId: payment.id,
            commissionId: commission.id,
            amount: commission.amount,
          },
        });

        await tx.commission.update({
          where: { id: commission.id },
          data: {
            status: "PAID",
            paidAt: new Date(),
          },
        });
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: user.id!,
          actionType: "MANUAL_PAYMENT_CREATED",
          actionDetails: JSON.stringify({
            paymentId: payment.id,
            recipientId,
            recipientName: `${recipient.firstName || ""} ${recipient.lastName || ""}`.trim() || recipient.email,
            paymentType,
            totalAmount,
            allocatedAmount,
            bonusAmount,
            commissionsAllocated: commissionIds.length,
            currency,
          }),
        },
      });

      return payment;
    });

    return { success: true, paymentId: result.id };
  } catch (error: any) {
    console.error("Failed to create manual payment:", error);
    return { error: error.message || "Failed to create manual payment" };
  }
}

// ─── Get Manual Payments (List) ───────────────────────────────

interface GetManualPaymentsFilters {
  search?: string;
  paymentType?: string;
  status?: string;
}

export async function getManualPayments(filters?: GetManualPaymentsFilters) {
  await requireFinanceOrAdmin();

  const where: any = {};

  if (filters?.paymentType && filters.paymentType !== "all") {
    where.paymentType = filters.paymentType;
  }

  if (filters?.status && filters.status !== "all") {
    where.status = filters.status;
  }

  if (filters?.search) {
    where.recipient = {
      OR: [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ],
    };
  }

  const payments = await prisma.manualPayment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      recipient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          ambassadorId: true,
        },
      },
      allocations: {
        select: {
          id: true,
          amount: true,
          commission: {
            select: {
              id: true,
              sourceType: true,
              amount: true,
            },
          },
        },
      },
    },
  });

  // Compute summary stats
  const completedPayments = payments.filter((p) => p.status === "COMPLETED");
  const summary = {
    totalCount: completedPayments.length,
    totalAmount: completedPayments.reduce(
      (sum, p) => sum + Number(p.totalAmount),
      0,
    ),
    totalAllocated: completedPayments.reduce(
      (sum, p) => sum + Number(p.allocatedAmount),
      0,
    ),
    totalBonus: completedPayments.reduce(
      (sum, p) => sum + Number(p.bonusAmount),
      0,
    ),
  };

  return {
    payments: payments.map((p) => ({
      ...p,
      totalAmount: Number(p.totalAmount),
      allocatedAmount: Number(p.allocatedAmount),
      bonusAmount: Number(p.bonusAmount),
      allocations: p.allocations.map((a) => ({
        ...a,
        amount: Number(a.amount),
        commission: {
          ...a.commission,
          amount: Number(a.commission.amount),
        },
      })),
    })),
    summary,
  };
}

// ─── Get Manual Payment Details ───────────────────────────────

export async function getManualPaymentDetails(id: string) {
  await requireFinanceOrAdmin();

  const payment = await prisma.manualPayment.findUnique({
    where: { id },
    include: {
      recipient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          ambassadorId: true,
        },
      },
      allocations: {
        include: {
          commission: {
            select: {
              id: true,
              sourceType: true,
              sourceId: true,
              amount: true,
              currency: true,
              status: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!payment) return null;

  return {
    ...payment,
    totalAmount: Number(payment.totalAmount),
    allocatedAmount: Number(payment.allocatedAmount),
    bonusAmount: Number(payment.bonusAmount),
    allocations: payment.allocations.map((a) => ({
      ...a,
      amount: Number(a.amount),
      commission: {
        ...a.commission,
        amount: Number(a.commission.amount),
      },
    })),
  };
}

// ─── Void Manual Payment ──────────────────────────────────────

export async function voidManualPayment(id: string) {
  const user = await requireFinanceOrAdmin();

  const payment = await prisma.manualPayment.findUnique({
    where: { id },
    include: {
      allocations: {
        select: { commissionId: true },
      },
      recipient: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  });

  if (!payment) {
    return { error: "Manual payment not found" };
  }

  if (payment.status === "VOIDED") {
    return { error: "Payment is already voided" };
  }

  try {
    await prisma.$transaction(async (tx: any) => {
      // Void the payment
      await tx.manualPayment.update({
        where: { id },
        data: { status: "VOIDED" },
      });

      // Revert linked commissions back to PENDING
      if (payment.allocations.length > 0) {
        const commissionIds = payment.allocations.map((a) => a.commissionId);
        await tx.commission.updateMany({
          where: { id: { in: commissionIds } },
          data: { status: "PENDING", paidAt: null },
        });
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: user.id!,
          actionType: "MANUAL_PAYMENT_VOIDED",
          actionDetails: JSON.stringify({
            paymentId: id,
            recipientName:
              `${payment.recipient.firstName || ""} ${payment.recipient.lastName || ""}`.trim() ||
              payment.recipient.email,
            totalAmount: Number(payment.totalAmount),
            commissionsReverted: payment.allocations.length,
          }),
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to void manual payment:", error);
    return { error: error.message || "Failed to void manual payment" };
  }
}
