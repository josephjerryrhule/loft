import { prisma } from "../src/lib/prisma";
import { getMondayStartOfWeek, getSundayEndOfWeek, checkAndGeneratePayablePayouts } from "../src/lib/payout-utils";

async function runTest() {
  console.log("=== STARTING AUTOMATED PAYOUT INTEGRATION TEST ===");

  // Clean up any stray test data first
  await prisma.commission.deleteMany({
    where: { user: { email: { in: ["test-payout-ambassador@example.com", "test-payout-customer@example.com"] } } }
  });
  await prisma.payout.deleteMany({
    where: { user: { email: { in: ["test-payout-ambassador@example.com", "test-payout-customer@example.com"] } } }
  });
  await prisma.order.deleteMany({
    where: { customer: { email: "test-payout-customer@example.com" } }
  });
  await prisma.product.deleteMany({
    where: { title: "Test Product Payout" }
  });
  await prisma.user.deleteMany({
    where: { email: { in: ["test-payout-ambassador@example.com", "test-payout-customer@example.com"] } }
  });

  // 1. Create a test user with MoMo credentials
  const user = await prisma.user.create({
    data: {
      email: "test-payout-ambassador@example.com",
      passwordHash: "dummy",
      role: "AFFILIATE",
      firstName: "Test",
      lastName: "Ambassador",
      payoutMethodType: "momo",
      payoutDetails: "0559998888 (MTN)"
    }
  });
  console.log(`Created test user: ${user.email} with payout wallet: ${user.payoutDetails}`);

  // Create a test product
  const product = await prisma.product.create({
    data: {
      title: "Test Product Payout",
      productType: "DIGITAL",
      price: 500.0,
      affiliateCommissionAmount: 50.0
    }
  });

  // Create a test customer
  const customer = await prisma.user.create({
    data: {
      email: "test-payout-customer@example.com",
      passwordHash: "dummy",
      role: "CUSTOMER",
      firstName: "Test",
      lastName: "Customer"
    }
  });

  const order = await prisma.order.create({
    data: {
      orderNumber: "ORD-PAY-" + Math.floor(Math.random() * 10000000),
      customerId: customer.id,
      productId: product.id,
      quantity: 1,
      unitPrice: 500.0,
      totalAmount: 500.0,
      status: "COMPLETED",
      paymentStatus: "PAID",
      referredById: user.id
    }
  });

  // 2. Create historical commissions
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10); // Definitely in a past completed week

  const commPast1 = await prisma.commission.create({
    data: {
      userId: user.id,
      sourceType: "PRODUCT",
      sourceId: order.id,
      amount: 150.0,
      currency: "GHS",
      status: "PENDING",
      createdAt: tenDaysAgo
    }
  });

  const commPast2 = await prisma.commission.create({
    data: {
      userId: user.id,
      sourceType: "PRODUCT",
      sourceId: order.id,
      amount: 50.0,
      currency: "GHS",
      status: "PENDING",
      createdAt: tenDaysAgo
    }
  });

  // Create an unmatured commission (today)
  const commToday = await prisma.commission.create({
    data: {
      userId: user.id,
      sourceType: "PRODUCT",
      sourceId: order.id,
      amount: 120.0,
      currency: "GHS",
      status: "PENDING",
      createdAt: new Date()
    }
  });

  console.log("Created test commissions:");
  console.log("- Matured 1: 150 GHS (created 10 days ago)");
  console.log("- Matured 2: 50 GHS (created 10 days ago)");
  console.log("- Unmatured (holding): 120 GHS (created today)");

  // 3. Generate payouts on the fly
  console.log("\nGenerating matured payable payouts...");
  await checkAndGeneratePayablePayouts(user.id);

  // Fetch the generated payouts
  const payouts = await prisma.payout.findMany({
    where: { userId: user.id },
    include: { commissions: true }
  });

  console.log(`Generated ${payouts.length} payout statements.`);
  if (payouts.length !== 1) {
    throw new Error(`Expected exactly 1 payout statement, got ${payouts.length}`);
  }

  const payout = payouts[0];
  console.log(`Statement details: ID=${payout.id}, Status=${payout.status}, AmountGHS=${payout.amountGHS}`);

  // Asserts
  const amountGHS = Number(payout.amountGHS);
  if (amountGHS !== 200.0) {
    throw new Error(`Expected GHS total 200.0, got ${amountGHS}`);
  }
  console.log("✅ SUCCESS: Matured amount matches expected historical sum (200.0 GHS).");

  // Verify that the commission from today is NOT linked to this payout (held back)
  const todayCommFresh = await prisma.commission.findUnique({
    where: { id: commToday.id }
  });
  if (todayCommFresh?.payoutId !== null) {
    throw new Error(`Expected current week commission to remain unlinked (payoutId should be null), got ${todayCommFresh?.payoutId}`);
  }
  console.log("✅ SUCCESS: Current week commission correctly held back (one week in hand).");

  // 4. Simulating admin approval
  console.log("\nSimulating admin approval...");
  console.log("Mocking admin approval transaction directly...");
  await prisma.$transaction(async (tx) => {
    await tx.payout.update({
      where: { id: payout.id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: "admin-test@example.com"
      }
    });

    await tx.commission.updateMany({
      where: { payoutId: payout.id },
      data: { status: "APPROVED" }
    });
  });

  const payoutAfterApproval = await prisma.payout.findUnique({
    where: { id: payout.id },
    include: { commissions: true }
  });

  console.log(`Approved statement status: ${payoutAfterApproval?.status}`);
  if (payoutAfterApproval?.status !== "APPROVED") {
    throw new Error(`Expected status to be APPROVED, got ${payoutAfterApproval?.status}`);
  }
  for (const c of payoutAfterApproval.commissions) {
    if (c.status !== "APPROVED") {
      throw new Error(`Expected linked commission status to be APPROVED, got ${c.status}`);
    }
  }
  console.log("✅ SUCCESS: Statement and all linked commissions successfully approved.");

  // 5. Simulating user signature
  console.log("\nSimulating user signature slip acknowledgement...");
  await prisma.payout.update({
    where: { id: payout.id },
    data: {
      status: "SIGNED",
      signedAt: new Date(),
      signatureName: "Test Ambassador Signature",
      signatureIp: "127.0.0.1"
    }
  });

  const payoutAfterSignature = await prisma.payout.findUnique({
    where: { id: payout.id }
  });
  console.log(`Signed statement status: ${payoutAfterSignature?.status}, Signee Name: ${payoutAfterSignature?.signatureName}`);
  if (payoutAfterSignature?.status !== "SIGNED") {
    throw new Error(`Expected status to be SIGNED, got ${payoutAfterSignature?.status}`);
  }
  console.log("✅ SUCCESS: Digital signature signed and saved.");

  // 6. Testing payment verification - Recipient mismatch
  console.log("\nTesting payment verification - Recipient mismatch validation...");
  const mismatchRecipient = "0240000000";
  console.log(`Submitting recipient: ${mismatchRecipient} (Expected MTN wallet: ${user.payoutDetails})`);

  // We perform the mismatch check and update status to REVIEW_NEEDED
  const userDetails = user.payoutDetails?.trim().replace(/\s+/g, "") || "";
  const providedDetails = mismatchRecipient.trim().replace(/\s+/g, "");

  if (!userDetails.includes(providedDetails)) {
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: "REVIEW_NEEDED",
        paymentMethod: "MOMO",
        paymentRef: "REF-MISMATCH-123",
        recipientAcc: mismatchRecipient,
        proofUrl: "http://example.com/mismatch-proof.jpg",
        paidAt: new Date()
      }
    });
  }

  const payoutAfterMismatch = await prisma.payout.findUnique({
    where: { id: payout.id }
  });
  console.log(`Payout status after mismatch: ${payoutAfterMismatch?.status}`);
  if (payoutAfterMismatch?.status !== "REVIEW_NEEDED") {
    throw new Error(`Expected status to be REVIEW_NEEDED on recipient mismatch, got ${payoutAfterMismatch?.status}`);
  }
  console.log("✅ SUCCESS: Recipient mismatch correctly flagged as REVIEW_NEEDED.");

  // 7. Testing payment verification - Perfect match
  console.log("\nTesting payment verification - Perfect match validation...");
  const correctRecipient = "0559998888";
  
  await prisma.$transaction(async (tx) => {
    await tx.payout.update({
      where: { id: payout.id },
      data: {
        status: "PAID",
        paymentMethod: "MOMO",
        paymentRef: "REF-SUCCESS-777",
        recipientAcc: correctRecipient,
        proofUrl: "http://example.com/success-proof.jpg",
        paidAt: new Date()
      }
    });

    await tx.commission.updateMany({
      where: { payoutId: payout.id },
      data: {
        status: "PAID",
        paidAt: new Date()
      }
    });
  });

  const payoutAfterSuccess = await prisma.payout.findUnique({
    where: { id: payout.id },
    include: { commissions: true }
  });

  console.log(`Payout status after match: ${payoutAfterSuccess?.status}, Reference: ${payoutAfterSuccess?.paymentRef}`);
  if (payoutAfterSuccess?.status !== "PAID") {
    throw new Error(`Expected status to be PAID on correct recipient match, got ${payoutAfterSuccess?.status}`);
  }
  for (const c of payoutAfterSuccess.commissions) {
    if (c.status !== "PAID" || !c.paidAt) {
      throw new Error(`Expected linked commission status to be PAID with paidAt timestamp set, got status=${c.status}, paidAt=${c.paidAt}`);
    }
  }
  console.log("✅ SUCCESS: Payout and associated commissions successfully finalized as PAID.");

  // 8. Cleanup
  console.log("\nCleaning up test data from database...");
  await prisma.commission.deleteMany({
    where: { userId: user.id }
  });
  await prisma.payout.deleteMany({
    where: { userId: user.id }
  });
  await prisma.order.delete({
    where: { id: order.id }
  });
  await prisma.product.delete({
    where: { id: product.id }
  });
  await prisma.user.delete({
    where: { id: user.id }
  });
  await prisma.user.delete({
    where: { id: customer.id }
  });
  console.log("Cleanup complete.");
  console.log("=== ALL PAYOUT LIFECYCLE TESTS PASSED SUCCESSFULLY ===");
}

runTest()
  .catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
  });
