import { prisma } from "@/lib/prisma";

export function getMondayStartOfWeek(d: Date | string): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday, ...
  // If day is Sunday (0), go back 6 days. Otherwise go back (day - 1) days.
  const diff = date.getDate() - (day === 0 ? 6 : day - 1);
  const start = new Date(date.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getSundayEndOfWeek(d: Date | string): Date {
  const start = getMondayStartOfWeek(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export async function checkAndGeneratePayablePayouts(userId: string) {
  // 1. Get the current week's Monday start. All commissions before this date are matured.
  const currentWeekMonday = getMondayStartOfWeek(new Date());

  // 2. Fetch all matured commissions for this user that are NOT associated with any payout yet
  const commissions = await prisma.commission.findMany({
    where: {
      userId,
      payoutId: null,
      createdAt: { lt: currentWeekMonday }
    }
  });

  if (commissions.length === 0) return;

  // 3. Group by week start date
  const groupedByWeek: Record<string, typeof commissions> = {};
  commissions.forEach(c => {
    const start = getMondayStartOfWeek(c.createdAt).toISOString();
    if (!groupedByWeek[start]) {
      groupedByWeek[start] = [];
    }
    groupedByWeek[start].push(c);
  });

  // 4. Create Payout records for each week
  for (const [weekKey, weekComms] of Object.entries(groupedByWeek)) {
    const weekStart = new Date(weekKey);
    const weekEnd = getSundayEndOfWeek(weekStart);

    // Sum GHS and USD
    let amountGHS = 0;
    let amountUSD = 0;
    weekComms.forEach(c => {
      const amt = Number(c.amount);
      if (c.currency === "USD") amountUSD += amt;
      else amountGHS += amt;
    });

    if (amountGHS === 0 && amountUSD === 0) continue;

    // Use prisma transaction to create Payout and link commissions
    await prisma.$transaction(async (tx) => {
      // Check if a Payout record already exists for this week & user
      let payout = await tx.payout.findUnique({
        where: {
          userId_weekStart_weekEnd: {
            userId,
            weekStart,
            weekEnd
          }
        }
      });

      if (!payout) {
        payout = await tx.payout.create({
          data: {
            userId,
            weekStart,
            weekEnd,
            amountGHS,
            amountUSD,
            status: "PAYABLE"
          }
        });
      } else {
        // If it exists and status is PAYABLE, we can append new commissions to it
        if (payout.status === "PAYABLE") {
          payout = await tx.payout.update({
            where: { id: payout.id },
            data: {
              amountGHS: Number(payout.amountGHS) + amountGHS,
              amountUSD: Number(payout.amountUSD) + amountUSD
            }
          });
        } else {
          // If the payout is already APPROVED, SIGNED, or PAID, we cannot edit it.
          // Commissions created retroactively for that week cannot be added.
          return;
        }
      }

      // Link commissions to the Payout
      await tx.commission.updateMany({
        where: { id: { in: weekComms.map(c => c.id) } },
        data: { payoutId: payout.id }
      });
    });
  }
}

export async function checkAndGenerateAllMaturedPayouts() {
  // Generate payouts for all users who have matured, unpayouted commissions
  const currentWeekMonday = getMondayStartOfWeek(new Date());
  
  // Find distinct userIds with unpayouted matured commissions
  const unpayoutedUsers = await prisma.commission.findMany({
    where: {
      payoutId: null,
      createdAt: { lt: currentWeekMonday }
    },
    select: {
      userId: true
    },
    distinct: ["userId"]
  });

  for (const record of unpayoutedUsers) {
    try {
      await checkAndGeneratePayablePayouts(record.userId);
    } catch (e) {
      console.error(`Failed to generate payouts for user ${record.userId}:`, e);
    }
  }
}
