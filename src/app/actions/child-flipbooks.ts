"use server";

import { prisma } from "@/lib/prisma";
import { getChildSession } from "@/lib/child-auth";
import { revalidatePath } from "next/cache";

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

    const totalBooksRead = await prisma.flipbookProgress.count({
      where: {
        childProfileId: child.id,
      },
    });

    const lastProgress = await prisma.flipbookProgress.findFirst({
      where: {
        childProfileId: child.id,
      },
      orderBy: { lastAccessedAt: "desc" },
      include: { flipbook: true },
    });

    // Fetch flipbooks matching the child's age group
    const flipbooks = await prisma.flipbook.findMany({
      where: {
        ageGroup: child.ageGroup,
        isPublished: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Generate virtual badges based on stats if none exist
    let currentBadges = Array.isArray(child.badges) ? (child.badges as any[]) : [];
    if (currentBadges.length === 0) {
      if (totalBooksRead >= 1) currentBadges.push({ id: "first-book", title: "First Step", icon: "🌱", description: "Read your first book!" });
      if (totalBooksRead >= 5) currentBadges.push({ id: "bookworm", title: "Bookworm", icon: "🐛", description: "Read 5 books!" });
      if (child.readingStreak >= 3) currentBadges.push({ id: "streak-3", title: "Early Bird", icon: "🌅", description: "3 day streak!" });
      if (child.readingStreak >= 7) currentBadges.push({ id: "streak-7", title: "Reliable Reader", icon: "📅", description: "7 day streak!" });
    }

    return { 
      flipbooks, 
      hasAccess: hasActiveSubscription,
      childName: child.name,
      stats: {
        readingStreak: child.readingStreak,
        badges: currentBadges,
        totalBooksRead,
      },
      lastReadProgress: lastProgress ? {
        id: lastProgress.flipbook.id,
        title: lastProgress.flipbook.title,
        coverImageUrl: lastProgress.flipbook.coverImageUrl,
        progress: Math.round((lastProgress.lastPageRead / (lastProgress.flipbook.totalPages || 1)) * 100),
      } : null
    };
  } catch (error) {
    console.error("Failed to fetch child flipbooks:", error);
    return { error: "Failed to fetch flipbooks" };
  }
}

export async function trackReadingProgress(flipbookId: string) {
  const session = await getChildSession();
  if (!session) return { error: "Unauthorized" };

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const child = await prisma.childProfile.findUnique({
      where: { id: session.childId },
    });

    if (!child) return { error: "Child not found" };

    let newStreak = child.readingStreak;
    const lastRead = child.lastReadingDate ? new Date(child.lastReadingDate) : null;
    const lastReadDay = lastRead ? new Date(lastRead.getFullYear(), lastRead.getMonth(), lastRead.getDate()) : null;

    if (!lastReadDay) {
      newStreak = 1;
    } else {
      const diffTime = today.getTime() - lastReadDay.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
      // If diffDays === 0, streak stays the same
    }

    // Update child stats
    await prisma.childProfile.update({
      where: { id: child.id },
      data: {
        readingStreak: newStreak,
        lastReadingDate: now,
      },
    });

    // Update or create flipbook progress
    await prisma.flipbookProgress.upsert({
      where: {
        childProfileId_flipbookId: {
          childProfileId: child.id,
          flipbookId: flipbookId,
        },
      },
      update: {
        lastAccessedAt: now,
      },
      create: {
        childProfileId: child.id,
        flipbookId: flipbookId,
        customerId: child.parentId, // Use parent's ID as customerId
        lastPageRead: 1,
        completed: false,
      },
    });

    revalidatePath("/child");
    return { success: true };
  } catch (error) {
    console.error("Failed to track progress:", error);
    return { error: "Failed to update stats" };
  }
}
