import { PrismaClient } from '@prisma/client';

/**
 * MANUAL COMMISSION UPDATE SCRIPT
 * 
 * Affiliate: LFT-AMB-010
 * Plan ID: 6b9b8fce-e36a-4326-90b2-ad5f37e8112a
 * Correct Rate: 60%
 * 
 * Instructions:
 * 1. Ensure your DATABASE_URL in .env is pointed to LIVE.
 * 2. Run with: npx tsx scratch/update-commission-live.ts
 */

const prisma = new PrismaClient();

async function main() {
  const AMBASSADOR_ID = 'LFT-AMB-010';
  const PLAN_ID = '6b9b8fce-e36a-4326-90b2-ad5f37e8112a';
  const TARGET_RATE = 0.60;

  console.log(`--- COMMISSION UPDATE START ---`);
  
  // 1. Find the User
  const user = await prisma.user.findUnique({
    where: { ambassadorId: AMBASSADOR_ID },
    select: { id: true, firstName: true, lastName: true, email: true }
  });

  if (!user) {
    console.error(`ERROR: Affiliate with ID ${AMBASSADOR_ID} not found.`);
    return;
  }

  console.log(`Target Affiliate: ${user.firstName} ${user.lastName} (${user.id})`);

  // 2. Find the Plan
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: PLAN_ID }
  });

  if (!plan) {
    console.error(`ERROR: Plan with ID ${PLAN_ID} not found.`);
    return;
  }

  console.log(`Target Plan: ${plan.name} (Price: ${plan.price})`);

  // 3. Find relevant commissions
  const commissions = await prisma.commission.findMany({
    where: {
      userId: user.id,
      sourceType: 'SUBSCRIPTION',
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Found ${commissions.length} subscription commissions for this user.`);

  let updatedCount = 0;

  for (const commission of commissions) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: commission.sourceId },
      include: { plan: true }
    });

    if (subscription && subscription.planId === PLAN_ID) {
      const planPrice = Number(subscription.plan.price);
      const correctAmount = planPrice * TARGET_RATE;
      const currentAmount = Number(commission.amount);

      console.log(`\nProcessing Commission: ${commission.id}`);
      console.log(`Current Amount: ${currentAmount}`);
      console.log(`Correct Amount (60%): ${correctAmount}`);

      if (Math.abs(currentAmount - correctAmount) > 0.01) {
        console.log(`Updating commission ${commission.id} to ${correctAmount}...`);
        
        await prisma.commission.update({
          where: { id: commission.id },
          data: { amount: correctAmount }
        });
        
        console.log(`✅ Success.`);
        updatedCount++;
      } else {
        console.log(`No update needed (already correct).`);
      }
    }
  }

  console.log(`\n--- UPDATE FINISHED ---`);
  console.log(`Total records updated: ${updatedCount}`);
}

main()
  .catch((e) => {
    console.error(`FATAL ERROR:`, e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
