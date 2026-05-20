import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.subscriptionPlan.findMany();
  console.log('PLANS:', JSON.stringify(plans, null, 2));

  const subs = await prisma.subscription.findMany({
    include: {
      plan: true
    }
  });
  console.log('SUBSCRIPTIONS:', JSON.stringify(subs, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
