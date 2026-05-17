import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getFlipbooksGroupedByCategory } from "@/app/actions/flipbooks";
import { listCategories } from "@/app/actions/categories";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AdminFlipbookLibraryClient } from "./AdminFlipbookLibraryClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminFlipbooksPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
    redirect("/parent");
  }

  const [groups, categories] = await Promise.all([
    getFlipbooksGroupedByCategory(),
    listCategories(),
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Flipbook Library"
        subtitle="Publish via Heyzine or upload a PDF that we render into a self-hosted flipbook."
      />
      <AdminFlipbookLibraryClient initialGroups={groups as any} categories={categories as any} />
    </div>
  );
}
