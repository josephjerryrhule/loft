"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const childProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date of birth",
  }),
  ageGroup: z.enum(["LITTLE_LOFTERS", "LOFT_365", "BIG_READERS"]),
  avatarColor: z.string().optional(),
});

export type ChildProfileInput = z.infer<typeof childProfileSchema>;

export async function getChildProfiles() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const children = await prisma.childProfile.findMany({
    where: { parentId: session.user.id },
    include: {
      subscriptions: {
        where: {
          endDate: { gte: new Date() },
          status: "ACTIVE",
        },
        include: { plan: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return children;
}

export async function createChildProfile(input: ChildProfileInput) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = childProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const { name, dateOfBirth, ageGroup, avatarColor } = parsed.data;

  try {
    const child = await prisma.childProfile.create({
      data: {
        parentId: session.user.id,
        name,
        dateOfBirth: new Date(dateOfBirth),
        ageGroup,
        avatarColor: avatarColor || "#6366f1",
      },
    });

    revalidatePath("/parent/children");
    revalidatePath("/parent");
    return { success: true, child };
  } catch (error) {
    console.error("Failed to create child profile:", error);
    return { error: "Failed to create child profile" };
  }
}

export async function updateChildProfile(
  id: string,
  input: ChildProfileInput
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // Verify ownership
  const existing = await prisma.childProfile.findFirst({
    where: { id, parentId: session.user.id },
  });
  if (!existing) return { error: "Child profile not found" };

  const parsed = childProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const { name, dateOfBirth, ageGroup, avatarColor } = parsed.data;

  try {
    const child = await prisma.childProfile.update({
      where: { id },
      data: {
        name,
        dateOfBirth: new Date(dateOfBirth),
        ageGroup,
        avatarColor: avatarColor || existing.avatarColor,
      },
    });

    revalidatePath("/parent/children");
    return { success: true, child };
  } catch (error) {
    console.error("Failed to update child profile:", error);
    return { error: "Failed to update child profile" };
  }
}

export async function deleteChildProfile(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // Verify ownership
  const existing = await prisma.childProfile.findFirst({
    where: { id, parentId: session.user.id },
  });
  if (!existing) return { error: "Child profile not found" };

  try {
    await prisma.childProfile.delete({ where: { id } });
    revalidatePath("/parent/children");
    revalidatePath("/parent");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete child profile:", error);
    return { error: "Failed to delete child profile" };
  }
}

