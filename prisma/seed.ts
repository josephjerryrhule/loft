import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "joseph@themewire.co";
  const password = "password123";
  const hashedPassword = await hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: hashedPassword,
      role: "ADMIN",
      firstName: "joe.seph",
      lastName: "R",
      phoneNumber: "+233249138607",
      status: "ACTIVE",
    },
  });

  console.log({ admin });

  // Create Free Plan (if doesn't exist)
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { id: "free-plan-default" },
    update: {},
    create: {
      id: "free-plan-default",
      name: "Free",
      description: "Access to free content only",
      price: 0,
      durationDays: 36500, // 100 years (essentially permanent)
      features: "Access to all free flipbooks",
      isActive: true,
    },
  });

  console.log({ freePlan });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
