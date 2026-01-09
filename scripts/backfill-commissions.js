const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SIGNUP_BONUS = 5.0;

async function backfill() {
  console.log("Starting commission backfill...");

  const customers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      referredById: { not: null },
    },
    select: {
      id: true,
      referredById: true,
      firstName: true,
      lastName: true,
    },
  });

  console.log(`Found ${customers.length} customers with referrers`);

  let created = 0,
    skipped = 0;

  for (const c of customers) {
    if (!c.referredById) continue;

    const exists = await prisma.commission.findFirst({
      where: {
        userId: c.referredById,
        sourceType: "SIGNUP",
        sourceId: c.id,
      },
    });

    if (exists) {
      skipped++;
      continue;
    }

    await prisma.commission.create({
      data: {
        userId: c.referredById,
        sourceType: "SIGNUP",
        sourceId: c.id,
        amount: SIGNUP_BONUS,
        status: "PENDING",
      },
    });
    created++;
    console.log(
      `✓ Created commission for referral of ${c.firstName || ""} ${
        c.lastName || ""
      }`
    );
  }

  console.log(
    `\nDone! Created: ${created}, Skipped (already existed): ${skipped}`
  );
  await prisma.$disconnect();
}

backfill().catch(console.error);
