"use server";

import { prisma } from "@/lib/prisma";

export async function getPlanDetails(planId: string) {
    return await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
        select: { id: true, price: true, name: true }
    });
}
