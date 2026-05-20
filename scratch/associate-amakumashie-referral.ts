import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mirror Role from types/commission
const Role = {
  OPERATIONS_MANAGER: 'OPERATIONS_MANAGER',
  MANAGER: 'MANAGER',
  TEAM_LEADER: 'TEAM_LEADER',
  AFFILIATE: 'AFFILIATE'
};

async function getCommissionRates() {
  const keys = [
    "globalPaidPlanReferralRate",
    "operationsManagerOverrideRate",
    "managerOverrideRate",
    "teamLeaderOverrideRate"
  ];

  const rates: Record<string, number> = {
    globalPaidPlanReferralRate: 0.20,
    operationsManagerOverrideRate: 0.05,
    managerOverrideRate: 0.03,
    teamLeaderOverrideRate: 0.02
  };

  try {
    const settings = await prisma.systemSettings.findMany({
      where: { key: { in: keys } }
    });

    settings.forEach(s => {
      try {
        const value = JSON.parse(s.value);
        rates[s.key] = Number(value) / 100;
      } catch (e) {
        console.error(`Failed to parse setting ${s.key}:`, e);
      }
    });
  } catch (e) {
    console.error("Failed to fetch commission rates from settings table:", e);
  }

  return rates;
}

async function main() {
  const CUSTOMER_EMAIL = 'amakumashie6@gmail.com';
  const TARGET_AMBASSADOR_ID = 'LFT-AMB-012';

  console.log(`\n=== ASSOCIATION & COMMISSION GENERATION SCRIPT ===`);
  console.log(`Target Customer: ${CUSTOMER_EMAIL}`);
  console.log(`Target Affiliate Ambassador ID: ${TARGET_AMBASSADOR_ID}`);
  
  // 1. Fetch the Customer
  const customer = await prisma.user.findUnique({
    where: { email: CUSTOMER_EMAIL },
    include: { referredBy: true }
  });

  if (!customer) {
    console.error(`❌ ERROR: Customer with email '${CUSTOMER_EMAIL}' not found in the database.`);
    return;
  }

  console.log(`Found Customer: ${customer.firstName || ''} ${customer.lastName || ''} (${customer.id})`);
  console.log(`Current Referral Status: ${customer.referredBy ? `${customer.referredBy.firstName} ${customer.referredBy.lastName} (${customer.referredBy.ambassadorId})` : 'Unassigned (None)'}`);

  // 2. Fetch the Target Affiliate
  const affiliate = await prisma.user.findUnique({
    where: { ambassadorId: TARGET_AMBASSADOR_ID }
  });

  if (!affiliate) {
    console.error(`❌ ERROR: Affiliate with Ambassador ID '${TARGET_AMBASSADOR_ID}' not found in the database.`);
    return;
  }

  console.log(`Found Target Affiliate: ${affiliate.firstName || ''} ${affiliate.lastName || ''} (${affiliate.id})`);
  console.log(`Affiliate Role: ${affiliate.role}, Status: ${affiliate.status}`);

  // 3. Update the customer referredById
  if (customer.referredById === affiliate.id) {
    console.log(`ℹ️ Customer is already assigned to the target affiliate. Skipping referredById update.`);
  } else {
    console.log(`Updating customer's referredById from '${customer.referredById || 'null'}' to '${affiliate.id}'...`);
    await prisma.user.update({
      where: { id: customer.id },
      data: { referredById: affiliate.id }
    });
    console.log(`✅ Customer referral association successfully updated!`);
  }

  // 4. Fetch customer completed subscriptions
  const subscriptions = await prisma.subscription.findMany({
    where: { 
      customerId: customer.id, 
      paymentStatus: 'COMPLETED' 
    },
    include: { plan: true }
  });

  console.log(`Found ${subscriptions.length} COMPLETED subscriptions for this customer.`);

  if (subscriptions.length === 0) {
    console.log(`ℹ️ No completed subscriptions found to process commissions for.`);
    return;
  }

  const rates = await getCommissionRates();
  console.log(`System Commission Rates:`, rates);

  for (const sub of subscriptions) {
    const planPrice = Number(sub.plan.price);
    console.log(`\n--- Processing Sub: ${sub.id} ---`);
    console.log(`Plan Name: ${sub.plan.name}, Price: GHS ${planPrice}`);

    if (planPrice === 0) {
      console.log(`Plan is free (Price: 0). Skipping commission processing.`);
      continue;
    }

    // Check if commissions already exist for this subscription
    const existingCommissions = await prisma.commission.findMany({
      where: {
        sourceType: 'SUBSCRIPTION',
        sourceId: sub.id
      },
      include: { user: true }
    });

    if (existingCommissions.length > 0) {
      console.log(`⚠️ Commissions already exist for subscription ${sub.id}:`);
      existingCommissions.forEach(comm => {
        console.log(`- Commission ID: ${comm.id}, User: ${comm.user.firstName} ${comm.user.lastName} (${comm.user.role}), Amount: GHS ${comm.amount}, Status: ${comm.status}`);
      });
      console.log(`Skipping commission generation to avoid duplication.`);
      continue;
    }

    // Generate Direct Commission
    let referralRate = rates.globalPaidPlanReferralRate;
    if (sub.plan.affiliateCommissionPercentage !== null && sub.plan.affiliateCommissionPercentage !== undefined) {
      referralRate = Number(sub.plan.affiliateCommissionPercentage) / 100;
    }
    const directCommissionAmount = planPrice * referralRate;

    console.log(`Creating direct referral commission of GHS ${directCommissionAmount.toFixed(2)} (${referralRate * 100}%) for ${affiliate.firstName} ${affiliate.lastName}...`);
    const directComm = await prisma.commission.create({
      data: {
        userId: affiliate.id,
        sourceType: 'SUBSCRIPTION',
        sourceId: sub.id,
        amount: directCommissionAmount,
        status: 'PENDING'
      }
    });
    console.log(`✅ Direct commission created: ${directComm.id}`);

    // Generate Overrides
    // 1. Team Leader Override (2%)
    if (affiliate.teamLeaderId) {
      const teamLeader = await prisma.user.findUnique({ where: { id: affiliate.teamLeaderId } });
      if (teamLeader) {
        const tlOverride = planPrice * rates.teamLeaderOverrideRate;
        console.log(`Creating Team Leader override of GHS ${tlOverride.toFixed(2)} (${rates.teamLeaderOverrideRate * 100}%) for ${teamLeader.firstName} ${teamLeader.lastName}...`);
        const tlComm = await prisma.commission.create({
          data: {
            userId: teamLeader.id,
            sourceType: 'SUBSCRIPTION',
            sourceId: sub.id,
            amount: tlOverride,
            status: 'PENDING'
          }
        });
        console.log(`✅ Team Leader override created: ${tlComm.id}`);
      }
    }

    // 2. Manager Override (3%)
    if (affiliate.managerId) {
      const manager = await prisma.user.findUnique({ where: { id: affiliate.managerId } });
      if (manager && manager.role !== Role.OPERATIONS_MANAGER) {
        const managerOverride = planPrice * rates.managerOverrideRate;
        console.log(`Creating Manager override of GHS ${managerOverride.toFixed(2)} (${rates.managerOverrideRate * 100}%) for ${manager.firstName} ${manager.lastName}...`);
        const mgrComm = await prisma.commission.create({
          data: {
            userId: manager.id,
            sourceType: 'SUBSCRIPTION',
            sourceId: sub.id,
            amount: managerOverride,
            status: 'PENDING'
          }
        });
        console.log(`✅ Manager override created: ${mgrComm.id}`);
      }
    }

    // 3. Operations Manager Override (5%)
    const opsManager = await prisma.user.findFirst({
      where: { role: Role.OPERATIONS_MANAGER, status: 'ACTIVE' }
    });
    if (opsManager) {
      const omOverride = planPrice * rates.operationsManagerOverrideRate;
      console.log(`Creating Operations Manager override of GHS ${omOverride.toFixed(2)} (${rates.operationsManagerOverrideRate * 100}%) for ${opsManager.firstName} ${opsManager.lastName}...`);
      const omComm = await prisma.commission.create({
        data: {
          userId: opsManager.id,
          sourceType: 'SUBSCRIPTION',
          sourceId: sub.id,
          amount: omOverride,
          status: 'PENDING'
        }
      });
      console.log(`✅ Operations Manager override created: ${omComm.id}`);
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: affiliate.id,
        actionType: 'SUBSCRIPTION_COMMISSION',
        actionDetails: `Earned commission from ${customer.firstName || ''} ${customer.lastName || ''}'s subscription (manually backfilled)`
      }
    });
    console.log(`✅ Activity log created for affiliate.`);
  }

  console.log(`\n=== SCRIPT COMPLETED SUCCESSFULLY ===`);
}

main()
  .catch(e => {
    console.error('❌ FATAL ERROR running script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
