import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@example.com";
  const password = "password123";
  const hashedPassword = await hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: hashedPassword,
      role: "ADMIN",
      firstName: "Admin",
      lastName: "User",
      phoneNumber: "+1234567890",
      status: "ACTIVE",
    },
  });

  console.log({ admin });
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
