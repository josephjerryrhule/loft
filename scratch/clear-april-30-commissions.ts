import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Searching for commissions matching April 30, 2026...');

  const startOfDay = new Date('2026-04-30T00:00:00.000Z');
  const endOfDay = new Date('2026-04-30T23:59:59.999Z');

  // Find matching commissions
  const commissions = await prisma.commission.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      }
    }
  });

  if (commissions.length === 0) {
    console.log('No commissions found for April 30, 2026.');
    return;
  }

  console.log(`Found ${commissions.length} commissions matching April 30, 2026:`);
  for (const c of commissions) {
    console.log(`- ID: ${c.id}`);
    console.log(`  User: ${c.user.email} (${c.user.firstName} ${c.user.lastName}) - Role: ${c.user.role}`);
    console.log(`  Amount: GHS ${Number(c.amount).toFixed(2)}`);
    console.log(`  Status: ${c.status}`);
    console.log(`  Source Type: ${c.sourceType}, Source ID: ${c.sourceId}`);
    console.log(`  Created: ${c.createdAt.toISOString()}`);
    console.log('---');
  }

  console.log('Deleting matching commissions...');
  const deleteResult = await prisma.commission.deleteMany({
    where: {
      id: { in: commissions.map(c => c.id) }
    }
  });

  console.log(`Successfully deleted ${deleteResult.count} commissions.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
