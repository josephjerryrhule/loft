"use server";

import { prisma } from "@/lib/prisma";
import { getChildSession } from "@/lib/child-auth";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { isFlipbookReadableForChild } from "@/lib/access-control.mjs";

export async function getChildFlipbooks() {
  noStore(); // Always read fresh from DB — never use cached data for stats
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
    const readableFlipbookWhere = {
      isPublished: true,
      ...(hasActiveSubscription ? {} : { isFree: true }),
      OR: [
        { ageGroup: child.ageGroup },
        { ageGroup: { contains: "all", mode: "insensitive" as const } },
        { ageGroup: "" },
        { ageGroup: null }
      ],
    };

    // Stats: Count unique books started
    const totalBooksRead = await prisma.flipbookProgress.count({
      where: {
        childProfileId: child.id,
      },
    });

    // Last read progress for "Continue Reading" card
    const lastProgress = await prisma.flipbookProgress.findFirst({
      where: {
        childProfileId: child.id,
        flipbook: readableFlipbookWhere,
      },
      orderBy: { lastAccessedAt: "desc" },
      include: { flipbook: true },
    });

    // Fetch flipbooks matching the child's age group or 'all' variants
    const flipbooks = await prisma.flipbook.findMany({
      where: readableFlipbookWhere,
      orderBy: { createdAt: "desc" },
    });

    // Generate virtual badges based on stats
    const currentBadges = Array.isArray(child.badges)
      ? (child.badges as Array<{ id: string; title: string; icon: string; description: string }>)
      : [];
    if (currentBadges.length === 0) {
      if (totalBooksRead >= 1) currentBadges.push({ id: "first-book", title: "First Step", icon: "🌱", description: "Read your first book!" });
      if (totalBooksRead >= 5) currentBadges.push({ id: "bookworm", title: "Bookworm", icon: "🐛", description: "Read 5 books!" });
      if (child.readingStreak >= 3) currentBadges.push({ id: "streak-3", title: "Early Bird", icon: "🌅", description: "3 day streak!" });
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
        progress: lastProgress.flipbook.totalPages ? Math.round((lastProgress.lastPageRead / lastProgress.flipbook.totalPages) * 100) : 0,
        isHeyzine: !!lastProgress.flipbook.heyzineUrl
      } : null
    };
  } catch (error) {
    console.error("Failed to fetch child flipbooks:", error);
    return { error: "Failed to fetch flipbooks" };
  }
}

export async function getChildLibraryFlipbooks(search?: string) {
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

    const flipbooks = await prisma.flipbook.findMany({
      where: {
        isPublished: true,
        ...(hasActiveSubscription ? {} : { isFree: true }),
        AND: [
          {
            OR: [
              { ageGroup: child.ageGroup },
              { ageGroup: { contains: "all", mode: "insensitive" } },
              { ageGroup: "" },
              { ageGroup: null }
            ]
          },
          ...(search ? [{
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
            ]
          }] : [])
        ]
      },
      orderBy: { createdAt: "desc" },
    });

    return { 
      flipbooks, 
      hasAccess: hasActiveSubscription 
    };
  } catch (error) {
    console.error("Failed to fetch child library flipbooks:", error);
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
      include: {
        subscriptions: {
          where: {
            endDate: { gte: now },
            status: "ACTIVE",
          },
        },
      },
    });

    if (!child) return { error: "Child not found" };

    const flipbook = await prisma.flipbook.findUnique({
      where: { id: flipbookId },
      select: { isFree: true, ageGroup: true, isPublished: true },
    });

    if (!flipbook || !flipbook.isPublished) return { error: "Flipbook not found" };
    if (!isFlipbookReadableForChild({
      isFree: flipbook.isFree,
      childHasSubscription: child.subscriptions.length > 0,
      flipbookAgeGroup: flipbook.ageGroup,
      childAgeGroup: child.ageGroup,
    })) {
      return { error: "Unauthorized" };
    }

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
    }

    // Update child stats and reading history
    await prisma.$transaction([
      prisma.childProfile.update({
        where: { id: child.id },
        data: {
          readingStreak: newStreak,
          lastReadingDate: now,
        },
      }),
      prisma.flipbookProgress.upsert({
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
          customerId: child.parentId,
          lastPageRead: 1,
          completed: false,
        },
      })
    ]);

    // Thorough revalidation
    revalidatePath("/child", "layout");
    revalidatePath("/child", "page");
    revalidatePath("/child/library", "page");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to track progress:", error);
    return { error: "Failed to update stats" };
  }
}
