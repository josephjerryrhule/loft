// JSON backup via Prisma. No external tools needed.
// Slower than pg_dump and loses raw SQL features (defaults, sequences, etc.),
// but useful when postgresql-client isn't installed locally.
//
// Usage:
//   node scripts/backup-db.mjs                     # writes backups/loft-<ts>.json
//   node scripts/backup-db.mjs /custom/path.json   # custom output path

import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

const MODELS = [
  "user", "category", "subscriptionPlan", "subscription", "flipbook",
  "flipbookProgress", "product", "order", "commission", "payoutRequest",
  "invitation", "activityLog", "systemSettings", "passwordResetToken",
  "emailVerificationToken", "childProfile", "childLoginToken",
];

function ts() {
  return new Date().toISOString().replace(/[:.]/g, "-").replace(/Z$/, "Z");
}

function bigintAware(_k, v) {
  if (typeof v === "bigint") return v.toString();
  return v;
}

async function main() {
  const out = process.argv[2] || `backups/loft-${ts()}.json`;
  await mkdir(path.dirname(out), { recursive: true });

  const dump = { exportedAt: new Date().toISOString(), tables: {} };
  for (const m of MODELS) {
    const rows = await prisma[m].findMany();
    dump.tables[m] = rows;
    console.log(`  ${m}: ${rows.length}`);
  }

  await writeFile(out, JSON.stringify(dump, bigintAware, 2));
  console.log(`Wrote ${out}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
