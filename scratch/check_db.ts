import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.subscriptionPlan.findMany();
  console.log("Plans:", JSON.stringify(plans, null, 2));

  const subs = await prisma.subscription.findMany({
    include: { plan: true, childProfile: true }
  });
  console.log("Subscriptions:", JSON.stringify(subs, null, 2));

  const children = await prisma.childProfile.findMany();
  console.log("Children:", JSON.stringify(children, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
