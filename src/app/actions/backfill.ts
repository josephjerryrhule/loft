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
