#!/usr/bin/env tsx

/**
 * Script: update-parent-to-customer.ts
 * Usage:
 *   npx tsx scripts/update-parent-to-customer.ts       # Dry-run (shows users to update)
 *   npx tsx scripts/update-parent-to-customer.ts --apply   # Apply the update
 *   npx tsx scripts/update-parent-to-customer.ts --limit=100 --apply
 *
 * This script updates users with role 'PARENT' who have no child_profiles
 * to role 'CUSTOMER'. It uses the Prisma client and the DATABASE_URL env var.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    apply: args.includes("--apply"),
    limit: (() => {
      const l = args.find(a => a.startsWith("--limit="));
      if (!l) return undefined;
      const v = parseInt(l.split("=")[1] || "", 10);
      return Number.isFinite(v) ? v : undefined;
    })(),
  };
}

async function main() {
  const { apply, limit } = parseArgs();

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set. Set it in your environment or use .env.local");
    process.exit(1);
  }

  console.log("Connecting to database...");

  // Find PARENT users with no child profiles
  const users = await prisma.user.findMany({
    where: {
      role: "PARENT",
      childProfiles: { none: {} },
    },
    select: { id: true, email: true, firstName: true, lastName: true },
    orderBy: { email: "asc" },
    take: limit ?? undefined,
  });

  console.log(`Found ${users.length} parent users with no children${limit ? ` (limited to ${limit})` : ""}.`);
  if (users.length === 0) {
    await prisma.$disconnect();
    return;
  }

  // Print a sample (or all if small)
  const sample = users.slice(0, 200).map(u => ({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName }));
  console.table(sample);

  if (!apply) {
    console.log("\nDRY RUN: No changes were made.");
    console.log("To apply the update, run:");
    console.log("  npx tsx scripts/update-parent-to-customer.ts --apply");
    if (!limit) console.log("Optionally add --limit=100 to restrict how many are changed in one run.");
    await prisma.$disconnect();
    return;
  }

  // Apply update in transaction
  console.log("Applying updates...");
  const result = await prisma.user.updateMany({
    where: {
      role: "PARENT",
      childProfiles: { none: {} },
    },
    data: { role: "CUSTOMER" },
  });

  console.log(`Updated ${result.count} users to role CUSTOMER.`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Error:", err);
  prisma.$disconnect().finally(() => process.exit(1));
});
