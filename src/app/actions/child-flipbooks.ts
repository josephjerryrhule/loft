"use server";

import { prisma } from "@/lib/prisma";
import { getChildSession } from "@/lib/child-auth";

export async function getChildFlipbooks() {
  const session = await getChildSession();
  if (!session) return { error: "Unauthorized" };

  try {
    const child = await prisma.childProfile.findUnique({
      where: { id: session.childId },
      include: {
        subscriptions: {
          where: {
            endDate: { gte: new Date() },
            status: "ACTIVE",
          },
        },
      },
    });

    if (!child) return { error: "Child not found" };

    const hasActiveSubscription = child.subscriptions.length > 0;

    // Fetch flipbooks matching the child's age group
    // If not subscribed, maybe we only show sample books?
    // Let's assume all books matching age group for now, or just the ones they have access to.
    const flipbooks = await prisma.flipbook.findMany({
      where: {
        ageGroup: child.ageGroup,
        // Only show published books (if we had a status field)
      },
      orderBy: { createdAt: "desc" },
    });

    return { 
      flipbooks, 
      hasAccess: hasActiveSubscription,
      childName: child.name,
    };
  } catch (error) {
    console.error("Failed to fetch child flipbooks:", error);
    return { error: "Failed to fetch flipbooks" };
  }
}
