const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SIGNUP_BONUS = 5.0;
const AFFILIATE_SUBSCRIPTION_FLAT = 10.0;

async function getManagerCommissionPercentage() {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: "managerCommissionPercentage" },
    });
    if (setting) {
      const value = JSON.parse(setting.value);
      return Number(value) / 100;
    }
  } catch (e) {
    console.error("Failed to get manager commission percentage:", e);
  }
  return 0.2; // Default 20%
}

async function backfillAll() {
  console.log("Starting commission backfill...\n");

  const managerPercentage = await getManagerCommissionPercentage();
  console.log(
    "Manager commission percentage:",
    managerPercentage * 100 + "%\n"
  );

  // 1. Backfill signup commissions
  console.log("--- SIGNUP COMMISSIONS ---");
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER", referredById: { not: null } },
    select: { id: true, referredById: true, firstName: true, lastName: true },
  });

  let signupCreated = 0,
    signupSkipped = 0;
  for (const c of customers) {
    if (!c.referredById) continue;
    const exists = await prisma.commission.findFirst({
      where: { userId: c.referredById, sourceType: "SIGNUP", sourceId: c.id },
    });
    if (exists) {
      signupSkipped++;
      continue;
    }
    await prisma.commission.create({
      data: {
        userId: c.referredById,
        sourceType: "SIGNUP",
        sourceId: c.id,
        amount: SIGNUP_BONUS,
        status: "PENDING",
      },
    });
    signupCreated++;
    console.log("✓ Created signup commission for", c.firstName || c.id);
  }
  console.log(
    "Signup commissions: Created",
    signupCreated,
    ", Skipped",
    signupSkipped,
    "\n"
  );

  // 2. Backfill order commissions
  console.log("--- ORDER COMMISSIONS ---");
  const orders = await prisma.order.findMany({
    where: {
      referredById: { not: null },
      paymentStatus: { in: ["PAID", "COMPLETED"] },
    },
    include: { product: true, referredBy: true },
  });

  let orderAffCreated = 0,
    orderMgrCreated = 0,
    orderSkipped = 0;
  for (const order of orders) {
    if (!order.referredBy) continue;
    const referrer = order.referredBy;
    const totalAmount = Number(order.totalAmount);

    // Affiliate commission
    const existsAff = await prisma.commission.findFirst({
      where: {
        userId: referrer.id,
        sourceType: { in: ["PRODUCT", "ORDER"] },
        sourceId: order.id,
      },
    });
    if (!existsAff) {
      const amount =
        referrer.role === "AFFILIATE"
          ? Number(order.product.affiliateCommissionAmount)
          : totalAmount * managerPercentage;
      await prisma.commission.create({
        data: {
          userId: referrer.id,
          sourceType: "PRODUCT",
          sourceId: order.id,
          amount,
          status: "PENDING",
        },
      });
      orderAffCreated++;
      console.log(
        "✓ Created order commission for",
        referrer.email,
        "- GHS",
        amount.toFixed(2)
      );
    } else {
      orderSkipped++;
    }

    // Manager commission
    if (referrer.role === "AFFILIATE" && referrer.managerId) {
      const existsMgr = await prisma.commission.findFirst({
        where: {
          userId: referrer.managerId,
          sourceType: { in: ["PRODUCT", "ORDER"] },
          sourceId: order.id,
        },
      });
      if (!existsMgr) {
        await prisma.commission.create({
          data: {
            userId: referrer.managerId,
            sourceType: "PRODUCT",
            sourceId: order.id,
            amount: totalAmount * managerPercentage,
            status: "PENDING",
          },
        });
        orderMgrCreated++;
        console.log(
          "✓ Created manager commission for order",
          order.orderNumber,
          "- GHS",
          (totalAmount * managerPercentage).toFixed(2)
        );
      }
    }
  }
  console.log(
    "Order commissions: Affiliate",
    orderAffCreated,
    ", Manager",
    orderMgrCreated,
    ", Skipped",
    orderSkipped,
    "\n"
  );

  // 3. Backfill subscription commissions
  console.log("--- SUBSCRIPTION COMMISSIONS ---");
  const subs = await prisma.subscription.findMany({
    include: { plan: true, customer: { include: { referredBy: true } } },
  });

  let subAffCreated = 0,
    subMgrCreated = 0,
    subSkipped = 0;
  for (const sub of subs) {
    const referrer = sub.customer.referredBy;
    if (!referrer) {
      subSkipped++;
      continue;
    }
    const planPrice = Number(sub.plan.price);

    // Affiliate commission
    const existsAff = await prisma.commission.findFirst({
      where: {
        userId: referrer.id,
        sourceType: "SUBSCRIPTION",
        sourceId: sub.id,
      },
    });
    if (!existsAff) {
      const amount =
        referrer.role === "AFFILIATE"
          ? AFFILIATE_SUBSCRIPTION_FLAT
          : planPrice * managerPercentage;
      await prisma.commission.create({
        data: {
          userId: referrer.id,
          sourceType: "SUBSCRIPTION",
          sourceId: sub.id,
          amount,
          status: "PENDING",
        },
      });
      subAffCreated++;
      console.log(
        "✓ Created subscription commission for",
        referrer.email,
        "- GHS",
        amount.toFixed(2)
      );
    } else {
      subSkipped++;
    }

    // Manager commission
    if (referrer.role === "AFFILIATE" && referrer.managerId) {
      const existsMgr = await prisma.commission.findFirst({
        where: {
          userId: referrer.managerId,
          sourceType: "SUBSCRIPTION",
          sourceId: sub.id,
        },
      });
      if (!existsMgr) {
        await prisma.commission.create({
          data: {
            userId: referrer.managerId,
            sourceType: "SUBSCRIPTION",
            sourceId: sub.id,
            amount: planPrice * managerPercentage,
            status: "PENDING",
          },
        });
        subMgrCreated++;
        console.log(
          "✓ Created manager subscription commission - GHS",
          (planPrice * managerPercentage).toFixed(2)
        );
      }
    }
  }
  console.log(
    "Subscription commissions: Affiliate",
    subAffCreated,
    ", Manager",
    subMgrCreated,
    ", Skipped",
    subSkipped,
    "\n"
  );

  console.log("=== BACKFILL COMPLETE ===");
  console.log(
    "Total created:",
    signupCreated + orderAffCreated + orderMgrCreated + subAffCreated + subMgrCreated
  );

  await prisma.$disconnect();
}

backfillAll().catch(console.error);
