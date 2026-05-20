import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Searching for subscriptions matching April 30, 2026...');

  const startOfDay = new Date('2026-04-30T00:00:00.000Z');
  const endOfDay = new Date('2026-04-30T23:59:59.999Z');

  // Find matching subscriptions
  const subs = await prisma.subscription.findMany({
    where: {
      OR: [
        {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        {
          startDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        {
          endDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      ]
    },
    include: {
      customer: {
        select: {
          email: true,
          firstName: true,
          lastName: true
        }
      },
      plan: true
    }
  });

  if (subs.length === 0) {
    console.log('No subscriptions found for April 30, 2026.');
    return;
  }

  console.log(`Found ${subs.length} subscriptions matching April 30, 2026:`);
  for (const sub of subs) {
    console.log(`- ID: ${sub.id}`);
    console.log(`  Customer: ${sub.customer.email} (${sub.customer.firstName} ${sub.customer.lastName})`);
    console.log(`  Plan: ${sub.plan.name} ($${sub.plan.price})`);
    console.log(`  Status: ${sub.status}, PaymentStatus: ${sub.paymentStatus}`);
    console.log(`  Dates: Start=${sub.startDate.toISOString()}, End=${sub.endDate.toISOString()}, Created=${sub.createdAt.toISOString()}`);
    console.log('---');
  }

  console.log('Deleting matching subscriptions...');
  const deleteResult = await prisma.subscription.deleteMany({
    where: {
      id: { in: subs.map(s => s.id) }
    }
  });

  console.log(`Successfully deleted ${deleteResult.count} subscriptions.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
