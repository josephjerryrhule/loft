const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const flipbooks = await prisma.flipbook.findMany({
      select: { category: true },
      distinct: ["category"],
    });
    console.log("Successfully queried categories:", flipbooks);
  } catch (e) {
    console.error("Error verifying prisma client:", e);
    process.exit(1);
  }
}

main();
