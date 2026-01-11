import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSubscriptionExpiredEmail } from "@/lib/email";

/**
 * Cron job to expire subscriptions that have passed their end date
 * 
 * Set up in Vercel:
 * 1. Go to Project Settings > Cron Jobs
 * 2. Add: /api/cron/expire-subscriptions
 * 3. Schedule: 0 0 * * * (daily at midnight)
 * 
 * Or use external service like cron-job.org to call this endpoint
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization (cron secret)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("Unauthorized cron attempt");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    console.log(`[CRON] Running subscription expiration check at ${now.toISOString()}`);

    // Find all active subscriptions that have passed their end date
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        endDate: {
          lt: now
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        plan: {
          select: {
            name: true,
            price: true
          }
        }
      }
    });

    console.log(`[CRON] Found ${expiredSubscriptions.length} expired subscriptions`);

    if (expiredSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No subscriptions to expire",
        expired: 0,
        timestamp: now.toISOString()
      });
    }

    // Process each expired subscription
    const results = await Promise.allSettled(
      expiredSubscriptions.map(async (subscription) => {
        try {
          // Update subscription status to EXPIRED
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "EXPIRED" }
          });

          // Check if user has any other active subscriptions
          const otherActiveSubscriptions = await prisma.subscription.findFirst({
            where: {
              customerId: subscription.customerId,
              status: "ACTIVE",
              endDate: { gte: now },
              id: { not: subscription.id }
            }
          });

          // If no other active subscriptions, assign to free plan
          if (!otherActiveSubscriptions) {
            // Find or create free plan
            let freePlan = await prisma.subscriptionPlan.findFirst({
              where: { 
                price: 0,
                isActive: true
              }
            });

            if (!freePlan) {
              // Create free plan if it doesn't exist
              freePlan = await prisma.subscriptionPlan.create({
                data: {
                  name: "Free",
                  description: "Access to free content only",
                  price: 0,
                  durationDays: 36500, // 100 years
                  features: "Access to all free flipbooks",
                  isActive: true
                }
              });
            }

            // Assign user to free plan
            const freeStartDate = new Date();
            const freeEndDate = new Date();
            freeEndDate.setDate(freeEndDate.getDate() + freePlan.durationDays);

            await prisma.subscription.create({
              data: {
                customerId: subscription.customerId,
                planId: freePlan.id,
                status: "ACTIVE",
                startDate: freeStartDate,
                endDate: freeEndDate,
                autoRenew: false
              }
            });

            console.log(`[CRON] Assigned user ${subscription.customer.email} to free plan`);
          }

          // Create activity log
          await prisma.activityLog.create({
            data: {
              userId: subscription.customerId,
              actionType: "SUBSCRIPTION_EXPIRED",
              actionDetails: JSON.stringify({
                subscriptionId: subscription.id,
                planName: subscription.plan.name,
                endDate: subscription.endDate.toISOString(),
                assignedToFreePlan: !otherActiveSubscriptions
              })
            }
          });

          // Send expiration email
          await sendSubscriptionExpiredEmail(
            subscription.customer.email,
            {
              firstName: subscription.customer.firstName || "Valued Customer",
              planName: subscription.plan.name,
              endDate: subscription.endDate
            }
          );

          console.log(`[CRON] Expired subscription ${subscription.id} for user ${subscription.customer.email}`);

          return {
            subscriptionId: subscription.id,
            userId: subscription.customerId,
            email: subscription.customer.email,
            status: "success"
          };
        } catch (error) {
          console.error(`[CRON] Failed to expire subscription ${subscription.id}:`, error);
          return {
            subscriptionId: subscription.id,
            userId: subscription.customerId,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      })
    );

    // Count successes and failures
    const successful = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

    console.log(`[CRON] Expiration complete: ${successful} succeeded, ${failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Expired ${successful} subscriptions`,
      expired: successful,
      failed: failed,
      timestamp: now.toISOString(),
      details: results
    });

  } catch (error) {
    console.error("[CRON] Subscription expiration error:", error);
    return NextResponse.json(
      {
        error: "Failed to expire subscriptions",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Allow POST as well for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
