import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const DEFAULT_EXCHANGE_RATES = {
  usdToGhsRate: 15.0,
  eurToGhsRate: 16.0,
  gbpToGhsRate: 19.0,
  usdToEurRate: 0.92,
  usdToGbpRate: 0.79,
  eurToUsdRate: 1.08,
  gbpToUsdRate: 1.27
};

const DEFAULT_COMMISSION_RATES = {
  globalPaidPlanReferralRate: 0.20,
  operationsManagerOverrideRate: 0.05,
  managerOverrideRate: 0.03,
  teamLeaderOverrideRate: 0.02
};

// Load current exchange rates from SystemSettings
async function getExchangeRates(): Promise<Record<string, number>> {
  const rates = { ...DEFAULT_EXCHANGE_RATES };
  try {
    const settings = await prisma.systemSettings.findMany({
      where: { key: { in: Object.keys(DEFAULT_EXCHANGE_RATES) } }
    });
    settings.forEach(s => {
      try {
        const parsed = JSON.parse(s.value);
        rates[s.key as keyof typeof DEFAULT_EXCHANGE_RATES] = Number(parsed);
      } catch {
        rates[s.key as keyof typeof DEFAULT_EXCHANGE_RATES] = Number(s.value);
      }
    });
  } catch (e) {
    console.error("Warning: Failed to load exchange rates from settings, using defaults.");
  }
  return rates;
}

// Load current commission rates from SystemSettings
async function getCommissionRates(): Promise<Record<string, number>> {
  const rates = { ...DEFAULT_COMMISSION_RATES };
  try {
    const settings = await prisma.systemSettings.findMany({
      where: { key: { in: Object.keys(DEFAULT_COMMISSION_RATES) } }
    });
    settings.forEach(s => {
      try {
        const parsed = JSON.parse(s.value);
        rates[s.key as keyof typeof DEFAULT_COMMISSION_RATES] = Number(parsed) / 100; // stored as percentage in db (e.g. 20)
      } catch {
        rates[s.key as keyof typeof DEFAULT_COMMISSION_RATES] = Number(s.value) / 100;
      }
    });
  } catch (e) {
    console.error("Warning: Failed to load commission rates from settings, using defaults.");
  }
  return rates;
}

// Converted commission logic
function convertCommission(
  amount: number,
  fromCurrency: string,
  toCountry: string | null | undefined,
  rates: Record<string, number>
): { amount: number; currency: string } {
  const currency = fromCurrency.toUpperCase();
  const isGhanaian = !toCountry || 
    toCountry.trim() === "" || 
    toCountry.trim().toLowerCase() === "ghana" || 
    toCountry.trim().toLowerCase() === "gh";

  if (isGhanaian) {
    if (currency === "GHS") return { amount, currency: "GHS" };
    let converted = amount;
    if (currency === "USD") converted = amount * rates.usdToGhsRate;
    else if (currency === "EUR") converted = amount * rates.eurToGhsRate;
    else if (currency === "GBP") converted = amount * rates.gbpToGhsRate;
    return { amount: converted, currency: "GHS" };
  } else {
    if (currency === "USD") return { amount, currency: "USD" };
    let converted = amount;
    if (currency === "GHS") converted = amount / rates.usdToGhsRate;
    else if (currency === "EUR") converted = amount * rates.eurToUsdRate;
    else if (currency === "GBP") converted = amount * rates.gbpToUsdRate;
    return { amount: converted, currency: "USD" };
  }
}

// Database Backup Failsafe Runner
async function backupDatabase(timestamp: string): Promise<string> {
  const backupsDir = path.join(process.cwd(), "scripts", "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  // 1. Try pg_dump
  const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (dbUrl) {
    const sqlBackupPath = path.join(backupsDir, `backup-${timestamp}.sql`);
    console.log(`Attempting pg_dump backup to ${sqlBackupPath}...`);
    try {
      // Check if pg_dump is available
      execSync("pg_dump --version", { stdio: "ignore" });
      execSync(`pg_dump "${dbUrl}" -F p -b -v -f "${sqlBackupPath}"`, { stdio: "inherit" });
      console.log(`✅ Success: Database backed up via pg_dump to ${sqlBackupPath}`);
      return sqlBackupPath;
    } catch (e) {
      console.log("⚠️ pg_dump failed or is not installed. Falling back to Prisma JSON export backup...");
    }
  }

  // 2. Failsafe Prisma JSON backup of key tables
  const jsonBackupPath = path.join(backupsDir, `backup-${timestamp}.json`);
  console.log(`Creating failsafe JSON backup to ${jsonBackupPath}...`);
  try {
    const [users, subscriptions, plans, orders, commissions, payouts, logs] = await Promise.all([
      prisma.user.findMany(),
      prisma.subscription.findMany(),
      prisma.subscriptionPlan.findMany(),
      prisma.order.findMany(),
      prisma.commission.findMany(),
      prisma.payoutRequest.findMany(),
      prisma.activityLog.findMany()
    ]);

    const backupData = {
      backupTimestamp: new Date().toISOString(),
      users,
      subscriptions,
      plans,
      orders,
      commissions,
      payouts,
      logs
    };

    fs.writeFileSync(jsonBackupPath, JSON.stringify(backupData, null, 2), "utf-8");
    console.log(`✅ Success: Failsafe JSON backup saved to ${jsonBackupPath}`);
    return jsonBackupPath;
  } catch (e) {
    console.error("❌ Critical Error: Failed to perform failsafe JSON backup!", e);
    throw new Error("Database backup failed. Aborting recalculation for safety.");
  }
}

async function run() {
  const commit = process.argv.includes("--commit");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  
  console.log("=======================================================================");
  console.log(`COMMISSION RECALCULATION & BACKFILL (Payments on/after May 15, 2026)`);
  console.log(`Mode: ${commit ? "🚨 EXECUTE / COMMIT CHANGES" : "🔍 DRY RUN / SIMULATION"}`);
  console.log("=======================================================================");

  const may15 = new Date("2026-05-15T00:00:00Z");

  // Load configuration rates
  const rates = await getCommissionRates();
  const exchangeRates = await getExchangeRates();
  console.log("\nActive Settings Rates:");
  console.log("- Global subscription referral rate:", rates.globalPaidPlanReferralRate * 100 + "%");
  console.log("- Operations Manager override rate:", rates.operationsManagerOverrideRate * 100 + "%");
  console.log("- Manager override rate:", rates.managerOverrideRate * 100 + "%");
  console.log("- Team Leader override rate:", rates.teamLeaderOverrideRate * 100 + "%");
  console.log("\nActive Exchange Rates:");
  Object.entries(exchangeRates).forEach(([key, val]) => console.log(`- ${key}: ${val}`));

  // Perform database backup before committing
  let backupFile = "";
  if (commit) {
    backupFile = await backupDatabase(timestamp);
  }

  // Retrieve all commissions from May 15 onwards
  const commissions = await prisma.commission.findMany({
    where: { createdAt: { gte: may15 } },
    include: {
      user: true
    }
  });

  console.log(`\nFound ${commissions.length} commission records created on or after May 15, 2026.`);

  const auditReport: any[] = [];
  const adjustmentsToCreate: any[] = [];
  const updatesToApply: { id: string; amount: number; oldAmount: number }[] = [];

  let totalOldGHS = 0;
  let totalNewGHS = 0;
  let totalOldUSD = 0;
  let totalNewUSD = 0;

  for (const comm of commissions) {
    const currentAmount = Number(comm.amount);
    const curr = comm.currency || "GHS";
    if (curr === "GHS") totalOldGHS += currentAmount;
    if (curr === "USD") totalOldUSD += currentAmount;

    let targetUserId = comm.userId;
    let targetUser = comm.user;
    
    let recalculatedAmount = currentAmount;
    let recalculatedCurrency = curr;
    let details = "";

    if (comm.sourceType === "SUBSCRIPTION") {
      const sub = await prisma.subscription.findUnique({
        where: { id: comm.sourceId },
        include: {
          plan: true,
          customer: { include: { referredBy: true } }
        }
      });

      if (!sub) {
        details = `Subscription not found for sourceId ${comm.sourceId}`;
        auditReport.push({ id: comm.id, sourceType: comm.sourceType, currentAmount, currency: curr, recalculatedAmount: currentAmount, status: "SKIPPED_NOT_FOUND", details });
        continue;
      }

      const referrer = sub.customer.referredBy;
      if (!referrer) {
        details = `Customer ${sub.customer.email} has no referrer, skipping`;
        auditReport.push({ id: comm.id, sourceType: comm.sourceType, currentAmount, currency: curr, recalculatedAmount: currentAmount, status: "SKIPPED_NO_REFERRER", details });
        continue;
      }

      // Reconstruct checkout amountPaid in checkout currency
      const subCurrency = sub.currency || "GHS";
      let planPrice = 0;
      if (subCurrency === "GHS") {
        planPrice = Number(sub.plan.price);
      } else if (subCurrency === "USD") {
        planPrice = Number(sub.plan.priceUSD);
      } else {
        const usdPrice = Number(sub.plan.priceUSD);
        if (subCurrency === "EUR") planPrice = usdPrice * (exchangeRates.usdToEurRate || 0.92);
        else if (subCurrency === "GBP") planPrice = usdPrice * (exchangeRates.usdToGbpRate || 0.79);
      }

      // 1. Direct referral subscription rate
      let referralRate = rates.globalPaidPlanReferralRate;
      if (sub.plan.affiliateCommissionPercentage !== null && sub.plan.affiliateCommissionPercentage !== undefined) {
        referralRate = Number(sub.plan.affiliateCommissionPercentage) / 100;
      }

      // 2. Determine if recipient is direct referrer vs override
      if (comm.userId === referrer.id) {
        // Direct referral
        const directBase = planPrice * referralRate;
        const converted = convertCommission(directBase, subCurrency, referrer.country, exchangeRates);
        recalculatedAmount = converted.amount;
        recalculatedCurrency = converted.currency;
        details = `Direct Subscription Referral (Plan: ${sub.plan.name}, Price: ${planPrice} ${subCurrency}, Rate: ${referralRate * 100}%)`;
      } else if (comm.userId === referrer.teamLeaderId) {
        // TL Override (2%)
        const tlOverrideBase = planPrice * rates.teamLeaderOverrideRate;
        const converted = convertCommission(tlOverrideBase, subCurrency, targetUser.country, exchangeRates);
        recalculatedAmount = converted.amount;
        recalculatedCurrency = converted.currency;
        details = `Team Leader Override (Plan: ${sub.plan.name}, Price: ${planPrice} ${subCurrency}, Rate: ${rates.teamLeaderOverrideRate * 100}%)`;
      } else if (comm.userId === referrer.managerId) {
        // Manager Override (3%)
        const managerOverrideBase = planPrice * rates.managerOverrideRate;
        const converted = convertCommission(managerOverrideBase, subCurrency, targetUser.country, exchangeRates);
        recalculatedAmount = converted.amount;
        recalculatedCurrency = converted.currency;
        details = `Manager Override (Plan: ${sub.plan.name}, Price: ${planPrice} ${subCurrency}, Rate: ${rates.managerOverrideRate * 100}%)`;
      } else if (targetUser.role === "OPERATIONS_MANAGER") {
        // OM Override (5%)
        const omOverrideBase = planPrice * rates.operationsManagerOverrideRate;
        const converted = convertCommission(omOverrideBase, subCurrency, targetUser.country, exchangeRates);
        recalculatedAmount = converted.amount;
        recalculatedCurrency = converted.currency;
        details = `Operations Manager Override (Plan: ${sub.plan.name}, Price: ${planPrice} ${subCurrency}, Rate: ${rates.operationsManagerOverrideRate * 100}%)`;
      } else {
        details = `Commission recipient ${targetUser.email} has unknown relationship to customer referrer ${referrer.email}`;
        auditReport.push({ id: comm.id, sourceType: comm.sourceType, currentAmount, currency: curr, recalculatedAmount: currentAmount, status: "SKIPPED_UNIDENTIFIED_RECIPIENT", details });
        continue;
      }

    } else if (comm.sourceType === "PRODUCT") {
      const order = await prisma.order.findUnique({
        where: { id: comm.sourceId },
        include: {
          product: true,
          customer: { include: { referredBy: true } }
        }
      });

      if (!order) {
        details = `Order not found for sourceId ${comm.sourceId}`;
        auditReport.push({ id: comm.id, sourceType: comm.sourceType, currentAmount, currency: curr, recalculatedAmount: currentAmount, status: "SKIPPED_NOT_FOUND", details });
        continue;
      }

      const referrer = order.customer.referredBy;
      if (!referrer) {
        details = `Customer ${order.customer.email} has no referrer, skipping`;
        auditReport.push({ id: comm.id, sourceType: comm.sourceType, currentAmount, currency: curr, recalculatedAmount: currentAmount, status: "SKIPPED_NO_REFERRER", details });
        continue;
      }

      const orderTotal = Number(order.totalAmount);

      // Direct product referral is a fixed value
      if (comm.userId === referrer.id) {
        recalculatedAmount = Number(order.product.affiliateCommissionAmount);
        recalculatedCurrency = "GHS"; // direct products are domestically GHS
        details = `Direct Product Referral (Product: ${order.product.title}, Fixed amount: ${recalculatedAmount})`;
      } else if (comm.userId === referrer.teamLeaderId) {
        const tlOverrideBase = orderTotal * rates.teamLeaderOverrideRate;
        const converted = convertCommission(tlOverrideBase, "GHS", targetUser.country, exchangeRates);
        recalculatedAmount = converted.amount;
        recalculatedCurrency = converted.currency;
        details = `Team Leader Override on Product Sale (Order Total: ${orderTotal} GHS, Rate: ${rates.teamLeaderOverrideRate * 100}%)`;
      } else if (comm.userId === referrer.managerId) {
        const managerOverrideBase = orderTotal * rates.managerOverrideRate;
        const converted = convertCommission(managerOverrideBase, "GHS", targetUser.country, exchangeRates);
        recalculatedAmount = converted.amount;
        recalculatedCurrency = converted.currency;
        details = `Manager Override on Product Sale (Order Total: ${orderTotal} GHS, Rate: ${rates.managerOverrideRate * 100}%)`;
      } else if (targetUser.role === "OPERATIONS_MANAGER") {
        const omOverrideBase = orderTotal * rates.operationsManagerOverrideRate;
        const converted = convertCommission(omOverrideBase, "GHS", targetUser.country, exchangeRates);
        recalculatedAmount = converted.amount;
        recalculatedCurrency = converted.currency;
        details = `Operations Manager Override on Product Sale (Order Total: ${orderTotal} GHS, Rate: ${rates.operationsManagerOverrideRate * 100}%)`;
      } else {
        details = `Commission recipient ${targetUser.email} has unknown relationship to customer referrer ${referrer.email}`;
        auditReport.push({ id: comm.id, sourceType: comm.sourceType, currentAmount, currency: curr, recalculatedAmount: currentAmount, status: "SKIPPED_UNIDENTIFIED_RECIPIENT", details });
        continue;
      }
    } else {
      details = `Skipping non-eligible sourceType: ${comm.sourceType}`;
      auditReport.push({ id: comm.id, sourceType: comm.sourceType, currentAmount, currency: curr, recalculatedAmount: currentAmount, status: "SKIPPED_INELIGIBLE_TYPE", details });
      continue;
    }

    // Rounding to 2 decimal places for comparisons and writes
    recalculatedAmount = Number(recalculatedAmount.toFixed(2));
    const amountDifference = recalculatedAmount - currentAmount;

    if (recalculatedCurrency === "GHS") totalNewGHS += recalculatedAmount;
    if (recalculatedCurrency === "USD") totalNewUSD += recalculatedAmount;

    const isDifferent = Math.abs(amountDifference) >= 0.01;

    if (isDifferent) {
      const change = {
        id: comm.id,
        userEmail: targetUser.email,
        sourceType: comm.sourceType,
        sourceId: comm.sourceId,
        currency: recalculatedCurrency,
        oldAmount: currentAmount,
        newAmount: recalculatedAmount,
        difference: amountDifference,
        status: comm.status,
        details
      };
      
      auditReport.push({ ...change, action: "RECALCULATED" });
      updatesToApply.push({ id: comm.id, amount: recalculatedAmount, oldAmount: currentAmount });

      // Handle already PAID commissions
      if (comm.status === "PAID") {
        adjustmentsToCreate.push({
          userId: targetUserId,
          sourceType: "COMMISSION_ADJUSTMENT",
          sourceId: comm.id,
          amount: amountDifference,
          currency: recalculatedCurrency,
          status: "APPROVED", // adjustment is immediately ready to pay or deduct from next approved request
          details: `Retroactive recalculation adjustment for Commission ID ${comm.id} (${details})`
        });
      }
    } else {
      auditReport.push({
        id: comm.id,
        userEmail: targetUser.email,
        sourceType: comm.sourceType,
        sourceId: comm.sourceId,
        currency: curr,
        oldAmount: currentAmount,
        newAmount: recalculatedAmount,
        difference: 0,
        status: comm.status,
        details: `${details} (Matches current value)`
      });
    }
  }

  console.log("\n=======================================================================");
  console.log(`Summary Report of Proposed Changes:`);
  console.log("=======================================================================");
  console.log(`Total Recalculated (Changed): ${updatesToApply.length} records.`);
  console.log(`- Pending/Approved Updates: ${updatesToApply.length - adjustmentsToCreate.length} records.`);
  console.log(`- Paid Adjustment Entries to Create: ${adjustmentsToCreate.length} records.`);
  
  console.log(`\nOverall GHS Totals: GHS ${totalOldGHS.toFixed(2)} ➡️  GHS ${totalNewGHS.toFixed(2)} (Diff: ${(totalNewGHS - totalOldGHS).toFixed(2)})`);
  console.log(`Overall USD Totals: USD ${totalOldUSD.toFixed(2)} ➡️  USD ${totalNewUSD.toFixed(2)} (Diff: ${(totalNewUSD - totalOldUSD).toFixed(2)})`);

  if (updatesToApply.length > 0) {
    console.log("\nDetailed changes details:");
    auditReport.filter(r => r.action === "RECALCULATED").forEach(r => {
      console.log(`- [${r.sourceType}] ${r.userEmail}: ${r.oldAmount} ${r.currency} ➡️  ${r.newAmount} ${r.currency} (Diff: ${r.difference.toFixed(2)} ${r.currency}) [Status: ${r.status}]`);
    });
  }

  // Dump detailed audit log file
  const auditLogsDir = path.join(process.cwd(), "scripts", "audits");
  if (!fs.existsSync(auditLogsDir)) {
    fs.mkdirSync(auditLogsDir, { recursive: true });
  }
  const auditFilePath = path.join(auditLogsDir, `recalculation-audit-${timestamp}.json`);
  fs.writeFileSync(auditFilePath, JSON.stringify({
    timestamp: new Date().toISOString(),
    mode: commit ? "EXECUTE" : "DRY_RUN",
    backupFile,
    totals: {
      oldGHS: totalOldGHS,
      newGHS: totalNewGHS,
      oldUSD: totalOldUSD,
      newUSD: totalNewUSD
    },
    changes: auditReport.filter(r => r.action === "RECALCULATED"),
    allScanned: auditReport
  }, null, 2), "utf-8");
  console.log(`\nAudit log saved to: ${auditFilePath}`);

  if (!commit) {
    console.log("\n🔍 DRY RUN COMPLETE: No database modifications were applied.");
    console.log("To apply these changes permanently, execute the script with the --commit flag:");
    console.log("npx tsx scripts/recalculate-commissions.ts --commit");
    return;
  }

  // Execute database writes inside a transaction
  console.log("\n🚨 Applying database modifications...");
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update commission amounts
      for (const update of updatesToApply) {
        await tx.commission.update({
          where: { id: update.id },
          data: { amount: update.amount }
        });
      }

      // 2. Create adjustment entries for PAID changes
      for (const adj of adjustmentsToCreate) {
        await tx.commission.create({
          data: {
            userId: adj.userId,
            sourceType: adj.sourceType,
            sourceId: adj.sourceId,
            amount: adj.amount,
            currency: adj.currency,
            status: adj.status
          }
        });
        
        // Log activity for the user adjustment
        await tx.activityLog.create({
          data: {
            userId: adj.userId,
            actionType: "COMMISSION_ADJUSTED",
            actionDetails: JSON.stringify({
              originalCommissionId: adj.sourceId,
              adjustmentAmount: adj.amount,
              currency: adj.currency,
              reason: adj.details
            })
          }
        });
      }

      // 3. Log main recalculation activity for admin auditor
      await tx.activityLog.create({
        data: {
          userId: "system", // recalculation run by script
          actionType: "COMMISSIONS_RECALCULATED_MIGRATION",
          actionDetails: JSON.stringify({
            timestamp: new Date().toISOString(),
            recordsChangedCount: updatesToApply.length,
            adjustmentsCreatedCount: adjustmentsToCreate.length,
            recalculationDateThreshold: "2026-05-15",
            auditLogPath: auditFilePath
          })
        }
      });
    });

    console.log("✅ Success: All commissions updated and transaction committed successfully!");
  } catch (err) {
    console.error("❌ CRITICAL ERROR: Transaction failed! Database changes rolled back.", err);
  }
}

run()
  .catch(e => console.error("Fatal Error running recalculation script:", e))
  .finally(() => prisma.$disconnect());
