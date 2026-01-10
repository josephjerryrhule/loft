"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Role } from "@/lib/types";

const SIGNUP_BONUS = 5.00;

/**
 * Backfill signup commissions for customers who signed up with referral codes
 * but didn't receive commission processing (before the fix was implemented)
 */
export async function backfillSignupCommissions() {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    // Find all customers who have a referrer
    const customersWithReferrers = await prisma.user.findMany({
        where: {
            role: Role.CUSTOMER,
            referredById: { not: null }
        },
        select: {
            id: true,
            referredById: true,
            firstName: true,
            lastName: true,
            createdAt: true
        }
    });

    let createdCount = 0;
    let skippedCount = 0;

    for (const customer of customersWithReferrers) {
        if (!customer.referredById) continue;

        // Check if commission already exists for this signup
        const existingCommission = await prisma.commission.findFirst({
            where: {
                userId: customer.referredById,
                sourceType: "SIGNUP",
                sourceId: customer.id
            }
        });

        if (existingCommission) {
            skippedCount++;
            continue;
        }

        // Create the commission
        await prisma.commission.create({
            data: {
                userId: customer.referredById,
                sourceType: "SIGNUP",
                sourceId: customer.id,
                amount: SIGNUP_BONUS,
                status: "PENDING"
            }
        });
        createdCount++;
    }

    return {
        success: true,
        message: `Backfill complete. Created ${createdCount} commissions, skipped ${skippedCount} (already existed).`
    };
}

async function getManagerCommissionPercentage(): Promise<number> {
    try {
        const setting = await prisma.systemSettings.findUnique({
            where: { key: "managerCommissionPercentage" }
        });
        if (setting) {
            const value = JSON.parse(setting.value);
            return Number(value) / 100;
        }
    } catch (e) {
        console.error("Failed to get manager commission percentage:", e);
    }
    return 0.20;
}

/**
 * Backfill order commissions for orders that have referrers
 * but didn't receive commission processing
 */
export async function backfillOrderCommissions() {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    // Get orders that have referrers (meaning the customer was referred by someone)
    const ordersWithReferrers = await prisma.order.findMany({
        where: {
            referredById: { not: null },
            paymentStatus: { in: ["PAID", "COMPLETED"] }
        },
        include: {
            product: true,
            referredBy: {
                include: {
                    manager: true
                }
            }
        }
    });

    const managerPercentage = await getManagerCommissionPercentage();
    let affiliateCreated = 0;
    let managerCreated = 0;
    let skipped = 0;

    for (const order of ordersWithReferrers) {
        if (!order.referredBy) continue;

        const referrer = order.referredBy;
        const totalAmount = Number(order.totalAmount);

        // Check if affiliate commission exists
        const existingAffiliateCommission = await prisma.commission.findFirst({
            where: {
                userId: referrer.id,
                sourceType: { in: ["PRODUCT", "ORDER"] },
                sourceId: order.id
            }
        });

        if (!existingAffiliateCommission) {
            // Create affiliate commission
            if (referrer.role === Role.AFFILIATE) {
                await prisma.commission.create({
                    data: {
                        userId: referrer.id,
                        sourceType: "PRODUCT",
                        sourceId: order.id,
                        amount: Number(order.product.affiliateCommissionAmount),
                        status: "PENDING"
                    }
                });
                affiliateCreated++;
            } else if (referrer.role === Role.MANAGER) {
                // Manager direct sale
                await prisma.commission.create({
                    data: {
                        userId: referrer.id,
                        sourceType: "PRODUCT",
                        sourceId: order.id,
                        amount: totalAmount * managerPercentage,
                        status: "PENDING"
                    }
                });
                affiliateCreated++;
            }
        } else {
            skipped++;
        }

        // Check manager commission (if affiliate has a manager)
        if (referrer.role === Role.AFFILIATE && referrer.managerId) {
            const existingManagerCommission = await prisma.commission.findFirst({
                where: {
                    userId: referrer.managerId,
                    sourceType: { in: ["PRODUCT", "ORDER"] },
                    sourceId: order.id
                }
            });

            if (!existingManagerCommission) {
                await prisma.commission.create({
                    data: {
                        userId: referrer.managerId,
                        sourceType: "PRODUCT",
                        sourceId: order.id,
                        amount: totalAmount * managerPercentage,
                        status: "PENDING"
                    }
                });
                managerCreated++;
            }
        }
    }

    return {
        success: true,
        message: `Order commission backfill complete. Affiliate commissions: ${affiliateCreated}, Manager commissions: ${managerCreated}, Skipped: ${skipped}`
    };
}

/**
 * Backfill subscription commissions
 */
export async function backfillSubscriptionCommissions() {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const AFFILIATE_SUBSCRIPTION_FLAT = 10.00;
    const managerPercentage = await getManagerCommissionPercentage();

    // Get subscriptions where customer was referred
    const subscriptions = await prisma.subscription.findMany({
        include: {
            plan: true,
            customer: {
                include: {
                    referredBy: {
                        include: {
                            manager: true
                        }
                    }
                }
            }
        }
    });

    let affiliateCreated = 0;
    let managerCreated = 0;
    let skipped = 0;

    for (const sub of subscriptions) {
        const referrer = sub.customer.referredBy;
        if (!referrer) {
            skipped++;
            continue;
        }

        const planPrice = Number(sub.plan.price);

        // Check affiliate commission
        const existingAffiliateCommission = await prisma.commission.findFirst({
            where: {
                userId: referrer.id,
                sourceType: "SUBSCRIPTION",
                sourceId: sub.id
            }
        });

        if (!existingAffiliateCommission) {
            if (referrer.role === Role.AFFILIATE) {
                await prisma.commission.create({
                    data: {
                        userId: referrer.id,
                        sourceType: "SUBSCRIPTION",
                        sourceId: sub.id,
                        amount: AFFILIATE_SUBSCRIPTION_FLAT,
                        status: "PENDING"
                    }
                });
                affiliateCreated++;
            } else if (referrer.role === Role.MANAGER) {
                await prisma.commission.create({
                    data: {
                        userId: referrer.id,
                        sourceType: "SUBSCRIPTION",
                        sourceId: sub.id,
                        amount: planPrice * managerPercentage,
                        status: "PENDING"
                    }
                });
                affiliateCreated++;
            }
        } else {
            skipped++;
        }

        // Check manager commission
        if (referrer.role === Role.AFFILIATE && referrer.managerId) {
            const existingManagerCommission = await prisma.commission.findFirst({
                where: {
                    userId: referrer.managerId,
                    sourceType: "SUBSCRIPTION",
                    sourceId: sub.id
                }
            });

            if (!existingManagerCommission) {
                await prisma.commission.create({
                    data: {
                        userId: referrer.managerId,
                        sourceType: "SUBSCRIPTION",
                        sourceId: sub.id,
                        amount: planPrice * managerPercentage,
                        status: "PENDING"
                    }
                });
                managerCreated++;
            }
        }
    }

    return {
        success: true,
        message: `Subscription commission backfill complete. Affiliate commissions: ${affiliateCreated}, Manager commissions: ${managerCreated}, Skipped: ${skipped}`
    };
}

/**
 * Run all commission backfills
 */
export async function backfillAllCommissions() {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return { error: "Unauthorized - Admin only" };
    }

    const results = [];

    const signupResult = await backfillSignupCommissions();
    results.push(`Signups: ${signupResult.message || signupResult.error}`);

    const orderResult = await backfillOrderCommissions();
    results.push(`Orders: ${orderResult.message || orderResult.error}`);

    const subResult = await backfillSubscriptionCommissions();
    results.push(`Subscriptions: ${subResult.message || subResult.error}`);

    return {
        success: true,
        message: results.join("\n")
    };
}
