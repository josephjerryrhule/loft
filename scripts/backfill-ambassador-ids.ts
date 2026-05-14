import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting ambassador ID backfill...");

  // Find all managers and affiliates who don't have an ambassador ID yet
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["MANAGER", "AFFILIATE"],
      },
      ambassadorId: null,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(`Found ${users.length} users to backfill.`);

  let count = 0;
  for (const user of users) {
    count++;
    // Generate ID: LFT-AMB-XXX (padded to 3 digits minimum)
    const ambassadorId = `LFT-AMB-${count.toString().padStart(3, "0")}`;

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { ambassadorId },
      });
      console.log(`Updated ${user.email}: ${ambassadorId}`);
    } catch (error) {
      console.error(`Failed to update ${user.email}:`, error);
    }
  }

  console.log("Backfill completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
