import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const rows = await prisma.flipbook.findMany({
    where: { category: { not: null }, categoryId: null },
    select: { id: true, category: true },
  });

  const distinct = Array.from(new Set(rows.map((r) => r.category!.trim()).filter(Boolean)));
  console.log(`Found ${distinct.length} distinct legacy category strings, ${rows.length} flipbook rows to migrate.`);

  for (const name of distinct) {
    const slug = slugify(name);
    if (!slug) continue;
    const cat = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, displayOrder: 1000 },
    });
    const updated = await prisma.flipbook.updateMany({
      where: { category: name, categoryId: null },
      data: { categoryId: cat.id },
    });
    console.log(`  ${name} (slug=${slug}) → ${updated.count} flipbooks linked`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
