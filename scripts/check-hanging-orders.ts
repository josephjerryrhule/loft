import { PrismaClient } from "@prisma/client";
import { processProductPayment, processSubscriptionPayment } from "../src/app/actions/payment";
import { getPaystackSecretKey } from "../src/lib/paystack";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const fulfillMode = args.includes("--fulfill");

  console.log("==========================================");
  console.log("  LOFT - Hanging Orders Detection Utility ");
  console.log("==========================================");
  console.log(`Mode: ${fulfillMode ? "\x1b[33mAUTO-FULFILL MODE\x1b[0m" : "\x1b[32mCHECK ONLY MODE\x1b[0m"}`);
  if (!fulfillMode) {
    console.log("Tip: Run with '--fulfill' to automatically recover hanging orders.");
  }
  console.log("------------------------------------------");

  const secretKey = await getPaystackSecretKey();
  if (!secretKey) {
    console.error("\x1b[31mError: Paystack Secret Key not found in system settings or environment variables.\x1b[0m");
    return;
  }

  console.log("Fetching recent successful transactions from Paystack...");
  
  // List transactions from Paystack (limit to 50 for check)
  const response = await fetch(
    "https://api.paystack.co/transaction?status=success&perPage=50",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      }
    }
  );

  const result = await response.json();
  if (!result.status || !Array.isArray(result.data)) {
    console.error("\x1b[31mError: Failed to fetch transactions from Paystack API.\x1b[0m", result.message);
    return;
  }

  const transactions = result.data;
  console.log(`Fetched ${transactions.length} successful transactions. Checking database records...\n`);

  let hangingCount = 0;

  for (const tx of transactions) {
    const reference = tx.reference;
    const amountGHS = tx.amount / 100;
    const email = tx.customer?.email || "Unknown Customer";
    
    // Parse metadata
    let metadata: any = {};
    if (typeof tx.metadata === "string") {
      try {
        metadata = JSON.parse(tx.metadata);
      } catch (e) {}
    } else if (tx.metadata) {
      metadata = tx.metadata;
    }

    const type = metadata?.type || "unknown";
    const itemId = metadata?.itemId || metadata?.productId || metadata?.planId || "unknown";
    const userId = metadata?.userId || "unknown";

    // 1. Check Subscription DB
    const sub = await prisma.subscription.findFirst({
      where: { paymentReference: reference }
    });

    // 2. Check Order DB
    const order = await prisma.order.findFirst({
      where: { paymentReference: reference }
    });

    if (!sub && !order) {
      hangingCount++;
      console.log(`\x1b[31m[HANGING] Reference: ${reference}\x1b[0m`);
      console.log(`  Customer: ${email}`);
      console.log(`  Amount: GHS ${amountGHS.toFixed(2)}`);
      console.log(`  Item Type: ${type}`);
      console.log(`  Item ID: ${itemId}`);
      console.log(`  User ID: ${userId}`);

      if (fulfillMode) {
        if (type === "subscription") {
          console.log(`  Attempting auto-fulfillment for Subscription...`);
          try {
            const res = await processSubscriptionPayment(reference, itemId, userId);
            if (res.error) {
              console.log(`  \x1b[31mFailed to fulfill subscription: ${res.error}\x1b[0m`);
            } else {
              console.log(`  \x1b[32mSuccessfully fulfilled subscription! Reference: ${reference}\x1b[0m`);
            }
          } catch (err: any) {
            console.log(`  \x1b[31mError fulfilling subscription: ${err?.message || err}\x1b[0m`);
          }
        } else if (type === "product") {
          console.log(`  Attempting auto-fulfillment for Product Order...`);
          try {
            const res = await processProductPayment(
              reference, 
              itemId, 
              metadata?.quantity || 1, 
              metadata?.customizationData, 
              metadata?.customerUploadUrl, 
              true, 
              userId
            );
            if (res.error) {
              console.log(`  \x1b[31mFailed to fulfill order: ${res.error}\x1b[0m`);
            } else {
              console.log(`  \x1b[32mSuccessfully created order! ID: ${res.order?.orderNumber}\x1b[0m`);
            }
          } catch (err: any) {
            console.log(`  \x1b[31mError fulfilling order: ${err?.message || err}\x1b[0m`);
          }
        } else {
          console.log(`  \x1b[33mWarning: Unknown transaction type '${type}'. Skipping.\x1b[0m`);
        }
      }
      console.log("------------------------------------------");
    }
  }

  console.log("==========================================");
  console.log(`Check complete. Found ${hangingCount} hanging transaction(s).`);
  console.log("==========================================");
}

main()
  .catch(err => {
    console.error("Script execution failed:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
