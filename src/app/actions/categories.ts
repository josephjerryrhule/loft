"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/slug";

async function assertAdminOrOps() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
    throw new Error("Unauthorized");
  }
}

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { flipbooks: true } } },
  });
}

export async function createCategory(name: string) {
  try {
    await assertAdminOrOps();
    const trimmed = name.trim();
    if (!trimmed) return { error: "Name required" };
    const slug = slugify(trimmed);
    if (!slug) return { error: "Name produces empty slug — use letters/numbers" };
    const last = await prisma.category.findFirst({
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });
    const cat = await prisma.category.create({
      data: { name: trimmed, slug, displayOrder: (last?.displayOrder ?? 0) + 10 },
    });
    revalidatePath("/settings");
    return { success: true, category: cat };
  } catch (e: any) {
    if (e?.code === "P2002") return { error: "A category with this name already exists" };
    if (e.message === "Unauthorized") return { error: "Unauthorized" };
    console.error("createCategory failed", e);
    return { error: "Failed to create category" };
  }
}

export async function renameCategory(id: string, name: string) {
  try {
    await assertAdminOrOps();
    const trimmed = name.trim();
    if (!trimmed) return { error: "Name required" };
    const slug = slugify(trimmed);
    if (!slug) return { error: "Name produces empty slug" };
    await prisma.category.update({ where: { id }, data: { name: trimmed, slug } });
    revalidatePath("/settings");
    revalidatePath("/admin/flipbooks");
    return { success: true };
  } catch (e: any) {
    if (e?.code === "P2002") return { error: "A category with this name already exists" };
    if (e.message === "Unauthorized") return { error: "Unauthorized" };
    return { error: "Failed to rename" };
  }
}

export async function reorderCategories(orderedIds: string[]) {
  try {
    await assertAdminOrOps();
    await prisma.$transaction(
      orderedIds.map((id, idx) =>
        prisma.category.update({
          where: { id },
          data: { displayOrder: (idx + 1) * 10 },
        })
      )
    );
    revalidatePath("/settings");
    revalidatePath("/admin/flipbooks");
    return { success: true };
  } catch (e: any) {
    if (e.message === "Unauthorized") return { error: "Unauthorized" };
    return { error: "Failed to reorder" };
  }
}

export async function deleteCategory(id: string) {
  try {
    await assertAdminOrOps();
    const count = await prisma.flipbook.count({ where: { categoryId: id } });
    if (count > 0) {
      return { error: `Category in use by ${count} flipbooks. Reassign first.` };
    }
    await prisma.category.delete({ where: { id } });
    revalidatePath("/settings");
    return { success: true };
  } catch (e: any) {
    if (e.message === "Unauthorized") return { error: "Unauthorized" };
    return { error: "Failed to delete" };
  }
}
