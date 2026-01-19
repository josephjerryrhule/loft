import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/types";
import { sendCommissionEarnedEmail } from "@/lib/email";

const SIGNUP_BONUS = 5.00; // Fallback default
const AFFILIATE_SUBSCRIPTION_FLAT = 10.00; // Fallback default

async function getManagerCommissionPercentage(): Promise<number> {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: "managerCommissionPercentage" }
    });
    if (setting) {
      const value = JSON.parse(setting.value);
      return Number(value) / 100; // Convert percentage to decimal
    }
  } catch (e) {
    console.error("Failed to get manager commission percentage:", e);
  }
  return 0.20; // Default 20%
}

async function getAffiliateSubscriptionCommission(): Promise<number> {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: "affiliateSubscriptionCommission" }
    });
    if (setting) {
      const value = JSON.parse(setting.value);
      return Number(value);
    }
  } catch (e) {
    console.error("Failed to get affiliate subscription commission:", e);
  }
  return AFFILIATE_SUBSCRIPTION_FLAT; // Default 10.00
}

async function getSignupCommission(): Promise<number> {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: "signupBonus" }
    });
    if (setting) {
      const value = JSON.parse(setting.value);
      return Number(value);
    }
  } catch (e) {
    console.error("Failed to get signup commission:", e);
  }
  return SIGNUP_BONUS; // Default 5.00
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

  const managerPercentage = await getManagerCommissionPercentage();

  // 1. Affiliate Commission (Flat rate per product)
  if (referrer.role === Role.AFFILIATE) {
      await prisma.commission.create({
          data: {
              userId: referrer.id,
              sourceType: "PRODUCT",
              sourceId: order.id,
              amount: product.affiliateCommissionAmount,
              status: "PENDING"
          }
      });
      
      // Send commission email to affiliate
      sendCommissionEarnedEmail({
        recipientEmail: referrer.email,
        recipientName: `${referrer.firstName || ""} ${referrer.lastName || ""}`.trim() || "Affiliate",
        amount: Number(product.affiliateCommissionAmount),
        orderId: order.id,
        type: "AFFILIATE",
      }).catch(console.error);

      // 2. Manager Commission (percentage from settings)
      if (referrer.managerId) {
          const managerCommissionAmount = totalAmount * managerPercentage;
          await prisma.commission.create({
              data: {
                  userId: referrer.managerId,
                  sourceType: "PRODUCT",
                  sourceId: order.id,
                  amount: managerCommissionAmount,
                  status: "PENDING"
              }
          });
          
          // Send commission email to manager
          const manager = await prisma.user.findUnique({ where: { id: referrer.managerId } });
          if (manager) {
            sendCommissionEarnedEmail({
              recipientEmail: manager.email,
              recipientName: `${manager.firstName || ""} ${manager.lastName || ""}`.trim() || "Manager",
              amount: managerCommissionAmount,
              orderId: order.id,
              type: "MANAGER",
            }).catch(console.error);
          }
      }
  } else if (referrer.role === Role.MANAGER) {
      // Direct Manager Sale - earns the commission percentage from settings
      const managerCommissionAmount = totalAmount * managerPercentage;
      await prisma.commission.create({
          data: {
              userId: referrer.id,
              sourceType: "PRODUCT",
              sourceId: order.id,
              amount: managerCommissionAmount,
              status: "PENDING"
          }
      });
      
      // Send commission email to manager
      sendCommissionEarnedEmail({
        recipientEmail: referrer.email,
        recipientName: `${referrer.firstName || ""} ${referrer.lastName || ""}`.trim() || "Manager",
        amount: managerCommissionAmount,
        orderId: order.id,
        type: "MANAGER",
      }).catch(console.error);
  }
}

export async function processSignupCommission(newUserId: string, referrerCode: string) {
    const referrer = await prisma.user.findUnique({ where: { inviteCode: referrerCode }});
    if (!referrer) return;

    // Only affiliates earn signup bonus - managers do not
    if (referrer.role !== Role.AFFILIATE) {
        console.log(`Skipping signup bonus: referrer ${referrer.id} is not an affiliate (role: ${referrer.role})`);
        return;
    }
    
    // We only pay if it's a Customer signup
    const newUser = await prisma.user.findUnique({ where: { id: newUserId }});
    if (newUser?.role !== Role.CUSTOMER) return;

    const signupBonus = await getSignupCommission();

    await prisma.commission.create({
        data: {
            userId: referrer.id,
            sourceType: "SIGNUP",
            sourceId: newUserId,
            amount: signupBonus,
            status: "PENDING"
        }
    });
}

export async function processSubscriptionCommission(subscriptionId: string, customerId: string, planPrice: number) {
    // Skip commission processing for free plans (price = 0)
    // Only signup bonus applies for free plans
    if (planPrice === 0) {
        console.log(`Skipping commission for free plan (subscription ${subscriptionId})`);
        return;
    }

    // Get the customer and their referrer
    const customer = await prisma.user.findUnique({
        where: { id: customerId },
        include: { referredBy: true }
    });

    if (!customer || !customer.referredBy) return;

    // Get the subscription to access plan details
    const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true }
    });

    if (!subscription) return;

    const referrer = customer.referredBy;
    const managerPercentage = await getManagerCommissionPercentage();
    
    // Use plan-specific commission percentage if available, otherwise fall back to global setting
    let affiliateCommission: number;
    if (subscription.plan.affiliateCommissionPercentage) {
        // Plan has a specific commission percentage defined
        const percentage = Number(subscription.plan.affiliateCommissionPercentage) / 100;
        affiliateCommission = planPrice * percentage;
    } else {
        // Fall back to global flat commission amount
        affiliateCommission = await getAffiliateSubscriptionCommission();
    }

    // Affiliate earns flat amount or percentage-based amount per subscription
    if (referrer.role === Role.AFFILIATE) {
        await prisma.commission.create({
            data: {
                userId: referrer.id,
                sourceType: "SUBSCRIPTION",
                sourceId: subscriptionId,
                amount: affiliateCommission,
                status: "PENDING"
            }
        });
        
        // Send commission email to affiliate
        sendCommissionEarnedEmail({
          recipientEmail: referrer.email,
          recipientName: `${referrer.firstName || ""} ${referrer.lastName || ""}`.trim() || "Affiliate",
          amount: affiliateCommission,
          subscriptionId,
          type: "AFFILIATE",
        }).catch(console.error);

        // Manager earns percentage from settings
        if (referrer.managerId) {
            const managerCommissionAmount = planPrice * managerPercentage;
            await prisma.commission.create({
                data: {
                    userId: referrer.managerId,
                    sourceType: "SUBSCRIPTION",
                    sourceId: subscriptionId,
                    amount: managerCommissionAmount,
                    status: "PENDING"
                }
            });
            
            // Send commission email to manager
            const manager = await prisma.user.findUnique({ where: { id: referrer.managerId } });
            if (manager) {
              sendCommissionEarnedEmail({
                recipientEmail: manager.email,
                recipientName: `${manager.firstName || ""} ${manager.lastName || ""}`.trim() || "Manager",
                amount: managerCommissionAmount,
                subscriptionId,
                type: "MANAGER",
              }).catch(console.error);
            }
        }
    } else if (referrer.role === Role.MANAGER) {
        // Direct manager referral - earns percentage from settings
        const managerCommissionAmount = planPrice * managerPercentage;
        await prisma.commission.create({
            data: {
                userId: referrer.id,
                sourceType: "SUBSCRIPTION",
                sourceId: subscriptionId,
                amount: managerCommissionAmount,
                status: "PENDING"
            }
        });
        
        // Send commission email to manager
        sendCommissionEarnedEmail({
          recipientEmail: referrer.email,
          recipientName: `${referrer.firstName || ""} ${referrer.lastName || ""}`.trim() || "Manager",
          amount: managerCommissionAmount,
          subscriptionId,
          type: "MANAGER",
        }).catch(console.error);
    }

    // Log activity
    await prisma.activityLog.create({
        data: {
            userId: referrer.id,
            actionType: "SUBSCRIPTION_COMMISSION",
            actionDetails: `Earned commission from ${customer.firstName || ""} ${customer.lastName || ""}'s subscription`
        }
    });
}

