import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findFirst({
    where: { title: "Birthday Book" }
  });
  
  if (!product) {
    console.log("No Birthday Book found!");
    return;
  }
  
  const updated = await prisma.product.update({
    where: { id: product.id },
    data: {
      featuredImageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500"
    }
  });
  
  console.log("Updated product image URL:", updated.featuredImageUrl);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
