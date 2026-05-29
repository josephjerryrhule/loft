import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Starting retroactive payout amount cleanup...");

  // Find all manual payment allocations
  const allocations = await prisma.manualPaymentAllocation.findMany({
    include: {
      commission: true
    }
  });

  console.log(`Found ${allocations.length} manual payment allocations.`);

  let updatedPayoutCount = 0;
  let deletedPayoutCount = 0;
  let unlinkedCommissionCount = 0;

  for (const alloc of allocations) {
    const { commission } = alloc;
    if (commission.payoutId) {
      const payout = await prisma.payout.findUnique({
        where: { id: commission.payoutId }
      });

      if (payout) {
        if (payout.status !== "PAID") {
          const isUSD = commission.currency === "USD";
          const currentAmountGHS = Number(payout.amountGHS);
          const currentAmountUSD = Number(payout.amountUSD);
          const commAmount = Number(commission.amount);

          const newAmountGHS = isUSD ? currentAmountGHS : Math.max(0, currentAmountGHS - commAmount);
          const newAmountUSD = isUSD ? Math.max(0, currentAmountUSD - commAmount) : currentAmountUSD;

          console.log(`Adjusting Payout ${payout.id} (status: ${payout.status}):`);
          console.log(`  Old GHS: ${currentAmountGHS}, New GHS: ${newAmountGHS}`);
          console.log(`  Old USD: ${currentAmountUSD}, New USD: ${newAmountUSD}`);

          if (newAmountGHS <= 0 && newAmountUSD <= 0) {
            await prisma.payout.delete({
              where: { id: payout.id }
            });
            console.log(`  Payout ${payout.id} deleted because amount is 0.`);
            deletedPayoutCount++;
          } else {
            await prisma.payout.update({
              where: { id: payout.id },
              data: {
                amountGHS: newAmountGHS,
                amountUSD: newAmountUSD
              }
            });
            updatedPayoutCount++;
          }
        } else {
          console.log(`Payout ${payout.id} is already PAID. Skipping payout amount reduction.`);
        }

        // Dissociate commission from payout
        await prisma.commission.update({
          where: { id: commission.id },
          data: { payoutId: null }
        });
        unlinkedCommissionCount++;
      }
    }
  }

  console.log("Cleanup complete!");
  console.log(`Adjusted payouts: ${updatedPayoutCount}`);
  console.log(`Deleted payouts (0 amount): ${deletedPayoutCount}`);
  console.log(`Unlinked commissions: ${unlinkedCommissionCount}`);
}

main()
  .catch(err => {
    console.error("Cleanup script failed:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
