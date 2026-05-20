import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Starting backfill for free plan subscriptions...');
  
  // Find all subscriptions to free plans
  const freeSubs = await prisma.subscription.findMany({
    where: {
      OR: [
        { planId: 'free-plan-default' },
        { plan: { price: 0 } }
      ],
      paymentStatus: 'PENDING'
    }
  });

  console.log(`Found ${freeSubs.length} pending free subscriptions to update.`);

  if (freeSubs.length > 0) {
    const updateResult = await prisma.subscription.updateMany({
      where: {
        id: { in: freeSubs.map(s => s.id) }
      },
      data: {
        paymentStatus: 'COMPLETED'
      }
    });
    console.log(`Successfully updated ${updateResult.count} subscriptions.`);
  }

  console.log('Backfill complete.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
