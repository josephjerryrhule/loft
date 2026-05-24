import { prisma } from "../src/lib/prisma";
import { Prisma } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const args = process.argv.slice(2);
  const backupFile = args.find((a: string) => !a.startsWith("--"));

  if (!backupFile) {
    console.error("Error: Please provide the path to the backup JSON file.");
    console.log("Usage: npx tsx scripts/db-restore.ts <path-to-backup-file> [--confirm]");
    process.exit(1);
  }

  const backupPath = path.resolve(backupFile);
  if (!fs.existsSync(backupPath)) {
    console.error(`Error: Backup file not found at ${backupPath}`);
    process.exit(1);
  }

  console.log(`=== RESTORING DATABASE FROM: ${backupPath} ===`);
  const data = JSON.parse(fs.readFileSync(backupPath, "utf-8"));

  const payouts = data.payouts;
  const commissions = data.commissions;

  console.log(`Found ${payouts.length} payouts and ${commissions.length} commissions to restore.`);
  
  const confirm = args.includes("--confirm");
  if (!confirm) {
    console.log("\n⚠️ WARNING: This will delete all current payout and commission records and replace them with the backup data.");
    console.log("To proceed, run the command with the --confirm flag:");
    console.log(`npx tsx scripts/db-restore.ts ${backupFile} --confirm`);
    return;
  }

  // Restore in a transaction
  await prisma.$transaction(async (tx: any) => {
    // 1. Delete all current commissions and payouts
    console.log("Deleting current commission records...");
    await tx.commission.deleteMany();
    
    console.log("Deleting current payout records...");
    await tx.payout.deleteMany();

    // 2. Insert payouts first (since commissions reference payoutId)
    console.log("Restoring payout records...");
    for (const p of payouts) {
      await tx.payout.create({
        data: {
          id: p.id,
          userId: p.userId,
          weekStart: new Date(p.weekStart),
          weekEnd: new Date(p.weekEnd),
          amountGHS: new Prisma.Decimal(p.amountGHS),
          amountUSD: new Prisma.Decimal(p.amountUSD),
          status: p.status,
          approvedAt: p.approvedAt ? new Date(p.approvedAt) : null,
          approvedBy: p.approvedBy,
          signedAt: p.signedAt ? new Date(p.signedAt) : null,
          signatureName: p.signatureName,
          signatureIp: p.signatureIp,
          paidAt: p.paidAt ? new Date(p.paidAt) : null,
          paymentMethod: p.paymentMethod,
          paymentRef: p.paymentRef,
          recipientAcc: p.recipientAcc,
          proofUrl: p.proofUrl,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }
      });
    }

    // 3. Insert commissions
    console.log("Restoring commission records...");
    for (const c of commissions) {
      await tx.commission.create({
        data: {
          id: c.id,
          userId: c.userId,
          sourceType: c.sourceType,
          sourceId: c.sourceId,
          amount: new Prisma.Decimal(c.amount),
          currency: c.currency,
          status: c.status,
          createdAt: new Date(c.createdAt),
          paidAt: c.paidAt ? new Date(c.paidAt) : null,
          payoutId: c.payoutId
        }
      });
    }
  });

  console.log("✅ Restore completed successfully!");
}

main().catch(console.error);
