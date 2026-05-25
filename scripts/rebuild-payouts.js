const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Helper functions (UTC-based)
function getMondayStartOfWeek(d) {
  const date = new Date(d);
  const day = date.getUTCDay(); // 0 is Sunday, 1 is Monday, ...
  const diff = date.getUTCDate() - (day === 0 ? 6 : day - 1);
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff, 0, 0, 0, 0));
  return start;
}

function getSundayEndOfWeek(d) {
  const start = getMondayStartOfWeek(d);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6, 23, 59, 59, 999));
  return end;
}

function getMaturedCutoffDate(now) {
  const currentMon = getMondayStartOfWeek(now);
  const day = now.getUTCDay(); // 0 is Sunday, 1 is Monday, ...
  if (day === 5 || day === 6 || day === 0) {
    return currentMon;
  } else {
    const cutoff = new Date(currentMon);
    cutoff.setUTCDate(currentMon.getUTCDate() - 7);
    return cutoff;
  }
}

async function rebuild() {
  console.log("=== STARTING PAYOUT REBUILD ===");

  // 1. Fetch all PAYABLE payouts
  const payablePayouts = await prisma.payout.findMany({
    where: { status: "PAYABLE" }
  });

  console.log(`Found ${payablePayouts.length} PAYABLE payouts in database.`);

  // 2. Unlink all commissions from PAYABLE payouts and delete PAYABLE payouts
  if (payablePayouts.length > 0) {
    const payoutIds = payablePayouts.map(p => p.id);

    console.log("Unlinking commissions...");
    await prisma.commission.updateMany({
      where: { payoutId: { in: payoutIds } },
      data: { payoutId: null }
    });

    console.log("Deleting PAYABLE payouts...");
    await prisma.payout.deleteMany({
      where: { id: { in: payoutIds } }
    });
    
    console.log("✅ PAYABLE payouts successfully deleted and commissions unlinked.");
  }

  // 3. Regenerate payouts using new UTC, Friday-maturity logic
  console.log("Regenerating payouts...");
  const maturedCutoff = getMaturedCutoffDate(new Date());
  
  // Find distinct userIds with unpayouted matured commissions
  const unpayoutedUsers = await prisma.commission.findMany({
    where: {
      payoutId: null,
      createdAt: { lt: maturedCutoff }
    },
    select: { userId: true },
    distinct: ["userId"]
  });

  console.log(`Found ${unpayoutedUsers.length} users with matured, unpayouted commissions.`);

  for (const record of unpayoutedUsers) {
    const userId = record.userId;
    
    // Fetch all matured commissions for this user that are NOT associated with any payout yet
    const commissions = await prisma.commission.findMany({
      where: {
        userId,
        payoutId: null,
        createdAt: { lt: maturedCutoff }
      }
    });

    if (commissions.length === 0) continue;

    // Group by week start date
    const groupedByWeek = {};
    commissions.forEach(c => {
      const start = getMondayStartOfWeek(c.createdAt).toISOString();
      if (!groupedByWeek[start]) {
        groupedByWeek[start] = [];
      }
      groupedByWeek[start].push(c);
    });

    // Create Payout records for each week
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

      await prisma.$transaction(async (tx) => {
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
          if (payout.status === "PAYABLE") {
            payout = await tx.payout.update({
              where: { id: payout.id },
              data: {
                amountGHS: Number(payout.amountGHS) + amountGHS,
                amountUSD: Number(payout.amountUSD) + amountUSD
              }
            });
          } else {
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

  console.log("✅ Payout regeneration complete!");

  // 4. Print the newly generated payouts
  const newPayouts = await prisma.payout.findMany({
    include: {
      user: { select: { email: true } }
    },
    orderBy: { weekStart: "asc" }
  });

  console.log(`\n=== REBUILT PAYOUTS IN DB (Total: ${newPayouts.length}) ===`);
  newPayouts.forEach(p => {
    console.log(`- Payout ID: ${p.id}, User: ${p.user.email}, Week Start: ${p.weekStart.toISOString()}, Week End: ${p.weekEnd.toISOString()}, Status: ${p.status}`);
  });
}

rebuild()
  .catch(e => console.error("Error rebuilding payouts:", e))
  .finally(() => prisma.$disconnect());
