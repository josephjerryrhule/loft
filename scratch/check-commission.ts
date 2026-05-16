import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ambassadorId = 'LFT-AMB-010';
  const planId = '6b9b8fce-e36a-4326-90b2-ad5f37e8112a';

  console.log(`Searching for affiliate: ${ambassadorId}`);
  const affiliate = await prisma.user.findUnique({
    where: { ambassadorId },
    select: { id: true, firstName: true, lastName: true, email: true }
  });

  if (!affiliate) {
    console.error('Affiliate not found');
    return;
  }

  console.log(`Affiliate found: ${affiliate.firstName} ${affiliate.lastName} (${affiliate.id})`);

  console.log(`Searching for plan: ${planId}`);
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId }
  });

  if (!plan) {
    console.error('Plan not found');
    return;
  }

  console.log(`Plan found: ${plan.name}, Price: ${plan.price}, Commission %: ${plan.affiliateCommissionPercentage}`);

  // Find commissions for this affiliate related to subscriptions of this plan
  const commissions = await prisma.commission.findMany({
    where: {
      userId: affiliate.id,
      sourceType: 'SUBSCRIPTION',
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Found ${commissions.length} subscription commissions for this affiliate.`);

  for (const commission of commissions) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: commission.sourceId },
      include: { plan: true }
    });

    if (subscription && subscription.planId === planId) {
      const planPrice = Number(subscription.plan.price);
      const expectedCommission = planPrice * 0.60;
      const currentCommission = Number(commission.amount);

      console.log(`---`);
      console.log(`Commission ID: ${commission.id}`);
      console.log(`Subscription ID: ${subscription.id}`);
      console.log(`Plan Price: ${planPrice}`);
      console.log(`Current Commission: ${currentCommission}`);
      console.log(`Expected Commission (60%): ${expectedCommission}`);
      
      if (Math.abs(currentCommission - expectedCommission) > 0.01) {
        console.log(`DISCREPANCY FOUND. Need to update.`);
      } else {
        console.log(`Commission matches expected 60%.`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
