const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function backfillPaidPayouts() {
  console.log("Starting paid payout backfill...");
  console.log("This will mark APPROVED commissions as PAID for already processed payout requests\n");

  // Get all PAID payout requests
  const paidPayouts = await prisma.payoutRequest.findMany({
    where: {
      status: "PAID",
    },
    include: {
      user: true,
    },
    orderBy: {
      processedAt: "asc",
    },
  });

  console.log(`Found ${paidPayouts.length} paid payout requests to process`);

  let totalCommissionsUpdated = 0;

  for (const payout of paidPayouts) {
    console.log(`\n--- Processing payout for ${payout.user.email} ---`);
    console.log(`   Payout amount: GHS ${Number(payout.amount).toFixed(2)}`);
    console.log(`   Processed at: ${payout.processedAt}`);

    const payoutAmount = Number(payout.amount);
    const userId = payout.userId;

    // Get all APPROVED commissions for this user
    const approvedCommissions = await prisma.commission.findMany({
      where: {
        userId: userId,
        status: "APPROVED",
      },
      orderBy: { createdAt: "asc" },
    });

    if (approvedCommissions.length === 0) {
      console.log(`   ⚠ No APPROVED commissions found - may already be processed`);
      continue;
    }

    let remainingAmount = payoutAmount;
    const commissionsToUpdate = [];

    // Mark commissions as PAID up to the payout amount
    for (const commission of approvedCommissions) {
      if (remainingAmount <= 0) break;

      const commissionAmount = Number(commission.amount);
      if (commissionAmount <= remainingAmount) {
        commissionsToUpdate.push(commission.id);
        remainingAmount -= commissionAmount;
      }
    }

    if (commissionsToUpdate.length > 0) {
      // Update commissions to PAID
      await prisma.commission.updateMany({
        where: { id: { in: commissionsToUpdate } },
        data: {
          status: "PAID",
          paidAt: payout.processedAt || new Date(),
        },
      });

      console.log(`   ✓ Marked ${commissionsToUpdate.length} commissions as PAID`);
      console.log(`   Total amount covered: GHS ${(payoutAmount - remainingAmount).toFixed(2)}`);
      
      totalCommissionsUpdated += commissionsToUpdate.length;

      // Log activity for the user
      await prisma.activityLog.create({
        data: {
          userId: userId,
          actionType: "PAYOUT_RECEIVED",
          actionDetails: JSON.stringify({
            amount: payoutAmount,
            requestId: payout.id,
            commissionsCount: commissionsToUpdate.length,
            backfilled: true,
          }),
        },
      });
    } else {
      console.log(`   ⚠ No commissions to update`);
    }
  }

  console.log(`\n=================================`);
  console.log(`Backfill complete!`);
  console.log(`Total payout requests processed: ${paidPayouts.length}`);
  console.log(`Total commissions marked as PAID: ${totalCommissionsUpdated}`);
  console.log(`=================================\n`);

  await prisma.$disconnect();
}

backfillPaidPayouts().catch((error) => {
  console.error("Backfill failed:", error);
  prisma.$disconnect();
});
