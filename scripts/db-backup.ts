import { prisma } from "../src/lib/prisma";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("=== STARTING DATABASE BACKUP ===");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(__dirname, "../backups");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Fetch all payouts
  const payouts = await prisma.payout.findMany();
  // Fetch all commissions
  const commissions = await prisma.commission.findMany();

  const backupData = {
    timestamp: new Date().toISOString(),
    payouts: payouts.map((p: any) => ({
      ...p,
      amountGHS: p.amountGHS.toString(),
      amountUSD: p.amountUSD.toString()
    })),
    commissions: commissions.map((c: any) => ({
      ...c,
      amount: c.amount.toString()
    }))
  };

  const backupPath = path.join(backupDir, `payouts-commissions-${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

  console.log(`✅ Backup successfully created at: ${backupPath}`);
  console.log(`   Saved ${payouts.length} payouts and ${commissions.length} commissions.`);
}

main().catch(console.error);
