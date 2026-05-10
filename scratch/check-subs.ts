import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const subs = await prisma.subscription.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
        plan: true
    }
  });
  console.log(JSON.stringify(subs, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
