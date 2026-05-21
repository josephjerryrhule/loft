import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/types";
import { sendCommissionEarnedEmail } from "@/lib/email";

async function getCommissionRates() {
  const keys = [
    "globalPaidPlanReferralRate",
    "operationsManagerOverrideRate",
    "managerOverrideRate",
    "teamLeaderOverrideRate"
  ];

  try {
    const settings = await prisma.systemSettings.findMany({
      where: { key: { in: keys } }
    });

    const rates: Record<string, number> = {
      globalPaidPlanReferralRate: 0.20,
      operationsManagerOverrideRate: 0.05,
      managerOverrideRate: 0.03,
      teamLeaderOverrideRate: 0.02
    };

    settings.forEach(s => {
      try {
        const value = JSON.parse(s.value);
        rates[s.key] = Number(value) / 100;
      } catch (e) {
        console.error(`Failed to parse setting ${s.key}:`, e);
      }
    });

    return rates;
  } catch (e) {
    console.error("Failed to fetch commission rates:", e);
    return {
      globalPaidPlanReferralRate: 0.20,
      operationsManagerOverrideRate: 0.05,
      managerOverrideRate: 0.03,
      teamLeaderOverrideRate: 0.02
    };
  }
}

export async function processOrderCommission(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true, customer: true, referredBy: true }
  });

  if (!order || !order.referredBy) return;

  // Check if commissions already exist for this order to prevent duplicates
  const existingCommissions = await prisma.commission.findFirst({
    where: {
      sourceType: "PRODUCT",
      sourceId: orderId
    }
  });

  if (existingCommissions) {
    console.log(`Commissions already exist for order ${orderId}, skipping...`);
    return;
  }

  // Only process commissions for COMPLETED orders
  if (order.status !== "COMPLETED") {
    console.log(`Order ${orderId} is not completed (status: ${order.status}), skipping commission processing...`);
    return;
  }

  const referrer = order.referredBy;
  const product = order.product;
  const totalAmount = parseFloat(order.totalAmount.toString());
  const rates = await getCommissionRates();

  // 1. Direct Referral Commission (Fixed product commission value)
  // For products, the brief says: "Same fixed product commission value as Affiliates on product sales"
  // Managers and Team Leaders get the same fixed amount as Affiliates for direct product sales.
  const directCommissionAmount = Number(product.affiliateCommissionAmount);
  
  await prisma.commission.create({
      data: {
          userId: referrer.id,
          sourceType: "PRODUCT",
          sourceId: order.id,
          amount: directCommissionAmount,
          status: "PENDING"
      }
  });
  
  sendCommissionEarnedEmail({
    recipientEmail: referrer.email,
    recipientName: `${referrer.firstName || ""} ${referrer.lastName || ""}`.trim() || "Ambassador",
    amount: directCommissionAmount,
    orderId: order.id,
    type: "REFERRAL",
  }).catch(console.error);

  // 2. Overrides on Product Sales
  await processOverrides({
    sourceType: "PRODUCT",
    sourceId: order.id,
    amount: totalAmount,
    referrer
  });
}

async function getExchangeRates(): Promise<Record<string, number>> {
  const keys = [
    "usdToGhsRate",
    "eurToGhsRate",
    "gbpToGhsRate",
    "usdToEurRate",
    "usdToGbpRate",
    "eurToUsdRate",
    "gbpToUsdRate"
  ];

  const rates: Record<string, number> = {
    usdToGhsRate: 15.0,
    eurToGhsRate: 16.0,
    gbpToGhsRate: 19.0,
    usdToEurRate: 0.92,
    usdToGbpRate: 0.79,
    eurToUsdRate: 1.08,
    gbpToUsdRate: 1.27
  };

  try {
    const settings = await prisma.systemSettings.findMany({
      where: { key: { in: keys } }
    });

    settings.forEach(s => {
      try {
        const parsed = JSON.parse(s.value);
        rates[s.key] = Number(parsed);
      } catch {
        rates[s.key] = Number(s.value);
      }
    });
  } catch (e) {
    console.error("Failed to load exchange rates:", e);
  }

  return rates;
}

function convertCommission(
  amount: number,
  fromCurrency: string,
  toCountry: string | null | undefined,
  rates: Record<string, number>
): { amount: number; currency: string } {
  const currency = fromCurrency.toUpperCase();
  const isGhanaian = toCountry?.trim().toLowerCase() === "ghana";

  if (isGhanaian) {
    // Target is GHS
    if (currency === "GHS") {
      return { amount, currency: "GHS" };
    }
    let converted = amount;
    if (currency === "USD") {
      converted = amount * rates.usdToGhsRate;
    } else if (currency === "EUR") {
      converted = amount * rates.eurToGhsRate;
    } else if (currency === "GBP") {
      converted = amount * rates.gbpToGhsRate;
    }
    return { amount: converted, currency: "GHS" };
  } else {
    // Target is USD
    if (currency === "USD") {
      return { amount, currency: "USD" };
    }
    let converted = amount;
    if (currency === "GHS") {
      converted = amount / rates.usdToGhsRate;
    } else if (currency === "EUR") {
      converted = amount * rates.eurToUsdRate;
    } else if (currency === "GBP") {
      converted = amount * rates.gbpToUsdRate;
    }
    return { amount: converted, currency: "USD" };
  }
}

export async function processSubscriptionCommission(subscriptionId: string, customerId: string, planPrice: number) {
    if (planPrice === 0) {
        console.log(`Skipping commission for free plan (subscription ${subscriptionId})`);
        return;
    }

    const customer = await prisma.user.findUnique({
        where: { id: customerId },
        include: { referredBy: true }
    });

    if (!customer || !customer.referredBy) return;

    const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true }
    });

    if (!subscription) return;

    const currency = subscription.currency || "GHS";
    const referrer = customer.referredBy;
    const rates = await getCommissionRates();
    
    // Direct Referral Commission on Subscription
    // Use plan-specific rate if available, otherwise fallback to global system rate
    let referralRate = rates.globalPaidPlanReferralRate;
    if (subscription.plan.affiliateCommissionPercentage !== null && subscription.plan.affiliateCommissionPercentage !== undefined) {
        referralRate = Number(subscription.plan.affiliateCommissionPercentage) / 100;
    }

    const directCommissionBase = planPrice * referralRate;
    const exchangeRates = await getExchangeRates();
    
    const { amount: directCommissionAmount, currency: commissionCurrency } = convertCommission(
      directCommissionBase,
      currency,
      referrer.country,
      exchangeRates
    );

    await prisma.commission.create({
        data: {
            userId: referrer.id,
            sourceType: "SUBSCRIPTION",
            sourceId: subscriptionId,
            amount: directCommissionAmount,
            currency: commissionCurrency,
            status: "PENDING"
        }
    });
    
    sendCommissionEarnedEmail({
      recipientEmail: referrer.email,
      recipientName: `${referrer.firstName || ""} ${referrer.lastName || ""}`.trim() || "Ambassador",
      amount: directCommissionAmount,
      subscriptionId,
      type: "REFERRAL",
    }).catch(console.error);

    // Overrides on Subscription Sales
    await processOverrides({
      sourceType: "SUBSCRIPTION",
      sourceId: subscriptionId,
      amount: planPrice,
      referrer,
      currency
    });

    // Log activity
    await prisma.activityLog.create({
        data: {
            userId: referrer.id,
            actionType: "SUBSCRIPTION_COMMISSION",
            actionDetails: `Earned commission from ${customer.firstName || ""} ${customer.lastName || ""}'s subscription`
        }
    });
}

async function processOverrides({
  sourceType,
  sourceId,
  amount,
  referrer,
  currency = "GHS"
}: {
  sourceType: string;
  sourceId: string;
  amount: number;
  referrer: any;
  currency?: string;
}) {
  const rates = await getCommissionRates();
  const exchangeRates = await getExchangeRates();

  // 1. Team Leader Override (2%)
  if (referrer.teamLeaderId) {
    const tlOverrideBase = amount * rates.teamLeaderOverrideRate;
    const teamLeader = await prisma.user.findUnique({ where: { id: referrer.teamLeaderId } });
    
    const { amount: tlOverride, currency: tlCurrency } = convertCommission(
      tlOverrideBase,
      currency,
      teamLeader?.country,
      exchangeRates
    );

    await prisma.commission.create({
      data: {
        userId: referrer.teamLeaderId,
        sourceType,
        sourceId,
        amount: tlOverride,
        currency: tlCurrency,
        status: "PENDING"
      }
    });

    if (teamLeader) {
      sendCommissionEarnedEmail({
        recipientEmail: teamLeader.email,
        recipientName: `${teamLeader.firstName || ""} ${teamLeader.lastName || ""}`.trim() || "Team Leader",
        amount: tlOverride,
        sourceId,
        type: "OVERRIDE_TL",
      } as any).catch(console.error);
    }
  }

  // 2. Manager Override (3%)
  // Managers get override on Affiliates and Team Leaders they manage
  if (referrer.managerId) {
    const manager = await prisma.user.findUnique({ where: { id: referrer.managerId } });
    
    // Only apply manager override if the assigned manager is NOT an Operations Manager.
    // Operations Managers only earn from the global ops override.
    if (manager && manager.role !== Role.OPERATIONS_MANAGER) {
      const managerOverrideBase = amount * rates.managerOverrideRate;
      
      const { amount: managerOverride, currency: managerCurrency } = convertCommission(
        managerOverrideBase,
        currency,
        manager.country,
        exchangeRates
      );

      await prisma.commission.create({
        data: {
          userId: referrer.managerId,
          sourceType,
          sourceId,
          amount: managerOverride,
          currency: managerCurrency,
          status: "PENDING"
        }
      });

      sendCommissionEarnedEmail({
        recipientEmail: manager.email,
        recipientName: `${manager.firstName || ""} ${manager.lastName || ""}`.trim() || "Manager",
        amount: managerOverride,
        sourceId,
        type: "OVERRIDE_MGR",
      } as any).catch(console.error);
    }
  }

  // 3. Operations Manager Override (5%)
  // OM gets 5% on EVERYTHING in the ambassador system
  const opsManager = await prisma.user.findFirst({
    where: { role: Role.OPERATIONS_MANAGER, status: "ACTIVE" }
  });

  if (opsManager) {
    const omOverrideBase = amount * rates.operationsManagerOverrideRate;
    
    const { amount: omOverride, currency: omCurrency } = convertCommission(
      omOverrideBase,
      currency,
      opsManager.country,
      exchangeRates
    );

    await prisma.commission.create({
      data: {
        userId: opsManager.id,
        sourceType,
        sourceId,
        amount: omOverride,
        currency: omCurrency,
        status: "PENDING"
      }
    });

    sendCommissionEarnedEmail({
      recipientEmail: opsManager.email,
      recipientName: `${opsManager.firstName || ""} ${opsManager.lastName || ""}`.trim() || "Operations Manager",
      amount: omOverride,
      sourceId,
      type: "OVERRIDE_OM",
    } as any).catch(console.error);
  }
}

