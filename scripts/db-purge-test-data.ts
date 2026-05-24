import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== STARTING PURGE OF TEST DATA ===");

  const testEmails = [
    "test-cleanup-ambassador@example.com",
    "test-cleanup-cust-a@example.com",
    "test-cleanup-cust-b@example.com",
    "test-payout-ambassador@example.com",
    "test-payout-customer@example.com"
  ];

  const testPlanNames = ["Cleanup Test Plan"];
  const testProductTitles = ["Test Product Payout"];

  // 1. Delete commissions linked to test users
  const deletedComms = await prisma.commission.deleteMany({
    where: {
      OR: [
        { user: { email: { in: testEmails } } },
        { sourceId: { in: await prisma.user.findMany({ where: { email: { in: testEmails } }, select: { id: true } }).then(users => users.map(u => u.id)) } }
      ]
    }
  });
  console.log(`Deleted ${deletedComms.count} test commission records.`);

  // 2. Delete payouts linked to test users
  const deletedPayouts = await prisma.payout.deleteMany({
    where: {
      user: { email: { in: testEmails } }
    }
  });
  console.log(`Deleted ${deletedPayouts.count} test payout records.`);

  // 3. Delete subscriptions linked to test users
  const deletedSubs = await prisma.subscription.deleteMany({
    where: {
      customer: { email: { in: testEmails } }
    }
  });
  console.log(`Deleted ${deletedSubs.count} test subscription records.`);

  // 4. Delete orders linked to test users
  const deletedOrders = await prisma.order.deleteMany({
    where: {
      OR: [
        { customer: { email: { in: testEmails } } },
        { referredBy: { email: { in: testEmails } } }
      ]
    }
  });
  console.log(`Deleted ${deletedOrders.count} test order records.`);

  // 5. Delete test plans
  const deletedPlans = await prisma.subscriptionPlan.deleteMany({
    where: {
      name: { in: testPlanNames }
    }
  });
  console.log(`Deleted ${deletedPlans.count} test subscription plans.`);

  // 6. Delete test products
  const deletedProducts = await prisma.product.deleteMany({
    where: {
      title: { in: testProductTitles }
    }
  });
  console.log(`Deleted ${deletedProducts.count} test products.`);

  // 7. Delete test users
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: { in: testEmails }
    }
  });
  console.log(`Deleted ${deletedUsers.count} test users.`);

  console.log("=== PURGE OF TEST DATA COMPLETE ===");
}

main().catch(console.error);
