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
      OR: [
        { ambassadorId: null },
        { ambassadorId: "" }
      ]
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(`Found ${users.length} users to backfill.`);

  for (const user of users) {
    const prefix = user.role === "MANAGER" ? "LFT-MGR" : "LFT-AMB";
    
    // Find the next available number for this prefix
    const existingUsers = await prisma.user.findMany({
      where: {
        ambassadorId: { startsWith: prefix }
      },
      select: { ambassadorId: true }
    });

    let maxNum = 0;
    existingUsers.forEach(u => {
      if (u.ambassadorId) {
        const parts = u.ambassadorId.split("-");
        const num = parseInt(parts[parts.length - 1]);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });

    const ambassadorId = `${prefix}-${(maxNum + 1).toString().padStart(3, "0")}`;

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { ambassadorId },
      });
      console.log(`Updated ${user.email} (${user.role}): ${ambassadorId}`);
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
