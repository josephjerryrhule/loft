const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function verifyFix() {
  console.log("Verifying commission status for affected users...\n");

  const paidPayouts = await prisma.payoutRequest.findMany({
    where: { status: "PAID" },
    include: { user: true },
  });

  for (const payout of paidPayouts) {
    console.log(`User: ${payout.user.email}`);
    console.log(`Payout Amount: GHS ${Number(payout.amount).toFixed(2)}`);
    
    const commissionStats = await prisma.commission.groupBy({
      by: ["status"],
      where: { userId: payout.userId },
      _sum: { amount: true },
      _count: true,
    });

    console.log("Commission breakdown:");
    commissionStats.forEach((stat) => {
      console.log(
        `  ${stat.status}: ${stat._count} commissions, Total: GHS ${Number(
          stat._sum.amount || 0
        ).toFixed(2)}`
      );
    });

    const approved = await prisma.commission.aggregate({
      where: { userId: payout.userId, status: "APPROVED" },
      _sum: { amount: true },
    });

    console.log(
      `\nApproved balance (ready for payout): GHS ${Number(
        approved._sum.amount || 0
      ).toFixed(2)}\n`
    );
    console.log("---\n");
  }

  await prisma.$disconnect();
}

verifyFix().catch(console.error);
