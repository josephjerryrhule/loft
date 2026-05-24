import { prisma } from "../src/lib/prisma";

async function checkIsSubscribedOrPaying(userId: string): Promise<boolean> {
  // Check if user has any paid subscription (plan price > 0)
  const paidSubscription = await prisma.subscription.findFirst({
    where: {
      customerId: userId,
      status: { in: ["ACTIVE", "PAID"] },
      plan: {
        price: { gt: 0 }
      }
    }
  });

  if (paidSubscription) return true;

  // Check if user has any paid order
  const paidOrder = await prisma.order.findFirst({
    where: {
      customerId: userId,
      paymentStatus: { in: ["PAID", "COMPLETED"] }
    }
  });

  if (paidOrder) return true;

  return false;
}

async function runCleanup(commit: boolean = false) {
  console.log(`=== RUNNING SIGNUP COMMISSIONS CLEANUP (${commit ? "COMMIT" : "DRY RUN"}) ===`);

  // 1. Fetch all SIGNUP commissions
  const signupCommissions = await prisma.commission.findMany({
    where: { sourceType: "SIGNUP" },
    include: {
      payout: true,
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  console.log(`Found ${signupCommissions.length} total SIGNUP commissions in the database.`);

  const toDelete = signupCommissions;

  console.log(`- To Delete (all signup commissions): ${toDelete.length}`);

  if (toDelete.length === 0) {
    console.log("No commissions need to be cleaned up.");
    return { deletedCount: 0, adjustedPayouts: 0 };
  }

  // Collect affected payout IDs
  const affectedPayoutIds = Array.from(new Set(toDelete.map((c: any) => c.payoutId).filter(Boolean))) as string[];

  console.log(`\nAffected Payout Statements: ${affectedPayoutIds.length}`);

  // Recalculation details for report
  let totalGhsRemoved = 0;
  let totalUsdRemoved = 0;

  for (const c of toDelete) {
    if (c.currency === "USD") {
      totalUsdRemoved += Number(c.amount);
    } else {
      totalGhsRemoved += Number(c.amount);
    }
  }

  console.log(`Overall GHS Totals: Diff: -${totalGhsRemoved.toFixed(2)} GHS`);
  console.log(`Overall USD Totals: Diff: -${totalUsdRemoved.toFixed(2)} USD`);

  if (!commit) {
    console.log("\n[DRY RUN ONLY] No changes were made to the database. Run with --commit to apply changes.");
    return { deletedCount: toDelete.length, adjustedPayouts: affectedPayoutIds.length };
  }

  // Apply changes in a transaction
  await prisma.$transaction(async (tx: any) => {
    // Delete the commissions
    const deleteResult = await tx.commission.deleteMany({
      where: {
        id: { in: toDelete.map((c: any) => c.id) }
      }
    });
    console.log(`Deleted ${deleteResult.count} commission records.`);

    // Adjust payouts
    for (const payoutId of affectedPayoutIds) {
      // Get remaining commissions for this payout
      const remainingCommissions = await tx.commission.findMany({
        where: { payoutId }
      });

      let newAmountGHS = 0;
      let newAmountUSD = 0;

      remainingCommissions.forEach((c: any) => {
        const amt = Number(c.amount);
        if (c.currency === "USD") newAmountUSD += amt;
        else newAmountGHS += amt;
      });

      const payout = await tx.payout.findUnique({
        where: { id: payoutId }
      });

      if (!payout) continue;

      if (remainingCommissions.length === 0) {
        if (payout.status !== "PAID") {
          // Delete unpaid payouts with no commissions remaining
          await tx.payout.delete({
            where: { id: payoutId }
          });
          console.log(`Deleted empty payout statement ID: ${payoutId} (Status: ${payout.status})`);
        } else {
          // Zero-out paid payouts (should not happen, but safe fallback)
          await tx.payout.update({
            where: { id: payoutId },
            data: { amountGHS: 0, amountUSD: 0 }
          });
          console.log(`Zeroed out PAID payout statement ID: ${payoutId} (No remaining commissions)`);
        }
      } else {
        // Update payout with new sums
        await tx.payout.update({
          where: { id: payoutId },
          data: {
            amountGHS: newAmountGHS,
            amountUSD: newAmountUSD
          }
        });
        console.log(`Adjusted payout statement ID: ${payoutId} -> GHS: ${newAmountGHS.toFixed(2)}, USD: ${newAmountUSD.toFixed(2)}`);
      }
    }
  });

  console.log("Database transaction committed successfully.");
  return { deletedCount: toDelete.length, adjustedPayouts: affectedPayoutIds.length };
}

// ==========================================
// INTEGRATION TEST SUITE
// ==========================================
async function runTest() {
  console.log("=== STARTING INTEGRATION TEST FOR SIGNUP CLEANUP ===");

  // Pre-cleanup of any previous stray test data in case a run failed mid-execution
  await prisma.commission.deleteMany({
    where: { user: { email: { in: ["test-cleanup-ambassador@example.com", "test-cleanup-cust-a@example.com", "test-cleanup-cust-b@example.com"] } } }
  });
  await prisma.payout.deleteMany({
    where: { user: { email: { in: ["test-cleanup-ambassador@example.com", "test-cleanup-cust-a@example.com", "test-cleanup-cust-b@example.com"] } } }
  });
  await prisma.subscription.deleteMany({
    where: { customer: { email: { in: ["test-cleanup-cust-a@example.com", "test-cleanup-cust-b@example.com"] } } }
  });
  await prisma.subscriptionPlan.deleteMany({
    where: { name: "Cleanup Test Plan" }
  });
  await prisma.product.deleteMany({
    where: { title: "Test Product Payout" }
  });
  await prisma.user.deleteMany({
    where: { email: { in: ["test-cleanup-ambassador@example.com", "test-cleanup-cust-a@example.com", "test-cleanup-cust-b@example.com"] } }
  });

  // 1. Create a test Ambassador
  const ambassador = await prisma.user.create({
    data: {
      email: "test-cleanup-ambassador@example.com",
      passwordHash: "dummy",
      role: "AFFILIATE",
      firstName: "Test",
      lastName: "Ambassador"
    }
  });

  // Create a product
  const product = await prisma.product.create({
    data: {
      title: "Test Product Payout",
      productType: "DIGITAL",
      price: 500.0,
      affiliateCommissionAmount: 50.0
    }
  });

  // 2. Create customer A (non-subscribed/non-paying signup)
  const customerA = await prisma.user.create({
    data: {
      email: "test-cleanup-cust-a@example.com",
      passwordHash: "dummy",
      role: "CUSTOMER",
      firstName: "Plain",
      lastName: "Customer",
      referredById: ambassador.id
    }
  });

  // Create customer B (paying/subscribed signup)
  const customerB = await prisma.user.create({
    data: {
      email: "test-cleanup-cust-b@example.com",
      passwordHash: "dummy",
      role: "CUSTOMER",
      firstName: "Subscribed",
      lastName: "Customer",
      referredById: ambassador.id
    }
  });

  // Create subscription plan
  const plan = await prisma.subscriptionPlan.create({
    data: {
      name: "Cleanup Test Plan",
      price: 150.0,
      durationDays: 30
    }
  });

  // Create active paid subscription for customer B
  await prisma.subscription.create({
    data: {
      customerId: customerB.id,
      planId: plan.id,
      status: "ACTIVE",
      paymentStatus: "COMPLETED",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  // Create historical signup bonus commissions for both
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  const commA = await prisma.commission.create({
    data: {
      userId: ambassador.id,
      sourceType: "SIGNUP",
      sourceId: customerA.id,
      amount: 5.0,
      currency: "GHS",
      status: "PENDING",
      createdAt: tenDaysAgo
    }
  });

  const commB = await prisma.commission.create({
    data: {
      userId: ambassador.id,
      sourceType: "SIGNUP",
      sourceId: customerB.id,
      amount: 5.0,
      currency: "GHS",
      status: "PENDING",
      createdAt: tenDaysAgo
    }
  });

  // 3. Link them to a test Payout statement
  const payout = await prisma.payout.create({
    data: {
      userId: ambassador.id,
      weekStart: tenDaysAgo,
      weekEnd: tenDaysAgo,
      amountGHS: 10.0,
      amountUSD: 0.0,
      status: "PAYABLE"
    }
  });

  await prisma.commission.updateMany({
    where: { id: { in: [commA.id, commB.id] } },
    data: { payoutId: payout.id }
  });

  console.log("Initial database state populated.");
  console.log(`Created test payout statement ID: ${payout.id} with GHS: 10.00`);

  // Run dry run check
  const dryRunResult = await runCleanup(false);
  console.log("✅ SUCCESS: Dry run executed.");

  // Run commit check
  const commitResult = await runCleanup(true);
  console.log("✅ SUCCESS: Commit executed.");

  // 4. Assertions
  const commAFresh = await prisma.commission.findUnique({ where: { id: commA.id } });
  if (commAFresh !== null) {
    throw new Error("Expected signup commission A to be deleted, but it still exists.");
  }
  console.log("✅ SUCCESS: Signup commission A successfully deleted.");

  const commBFresh = await prisma.commission.findUnique({ where: { id: commB.id } });
  if (commBFresh !== null) {
    throw new Error("Expected signup commission B to be deleted, but it still exists.");
  }
  console.log("✅ SUCCESS: Signup commission B successfully deleted.");

  const payoutFresh = await prisma.payout.findUnique({ where: { id: payout.id } });
  if (payoutFresh !== null) {
    throw new Error("Expected empty payout statement to be deleted, but it still exists.");
  }
  console.log("✅ SUCCESS: Empty payout statement successfully deleted.");

  // 5. Cleanup
  console.log("\nCleaning up test entities...");
  await prisma.commission.deleteMany({
    where: { userId: ambassador.id }
  });
  await prisma.payout.deleteMany({
    where: { userId: ambassador.id }
  });
  await prisma.subscription.deleteMany({
    where: { customerId: customerB.id }
  });
  await prisma.subscriptionPlan.delete({
    where: { id: plan.id }
  });
  await prisma.product.delete({
    where: { id: product.id }
  });
  await prisma.user.deleteMany({
    where: { id: { in: [ambassador.id, customerA.id, customerB.id] } }
  });

  console.log("=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY ===");
}

// Run script depending on argv
const args = process.argv.slice(2);
const isTest = args.includes("--test");
const isCommit = args.includes("--commit");

if (isTest) {
  runTest().catch((err: any) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
} else {
  runCleanup(isCommit).catch((err: any) => {
    console.error("Cleanup failed:", err);
    process.exit(1);
  });
}
