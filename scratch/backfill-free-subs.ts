import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Starting backfill for free plan subscriptions...');
  
  // Find all subscriptions to free plans that have PENDING or COMPLETED status
  // and should be COMPLETED_FREE instead
  const freeSubs = await prisma.subscription.findMany({
    where: {
      OR: [
        { planId: 'free-plan-default' },
        { plan: { price: 0 } }
      ],
      paymentStatus: { in: ['PENDING', 'COMPLETED'] }
    }
  });

  console.log(`Found ${freeSubs.length} free subscriptions to update to COMPLETED_FREE.`);

  if (freeSubs.length > 0) {
    const updateResult = await prisma.subscription.updateMany({
      where: {
        id: { in: freeSubs.map(s => s.id) }
      },
      data: {
        paymentStatus: 'COMPLETED_FREE'
      }
    });
    console.log(`Successfully updated ${updateResult.count} subscriptions.`);
  }

  console.log('Backfill complete.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
