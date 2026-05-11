import { auth } from "@/auth";
import { Role } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/auth/login");
  if ((session.user as { role?: string }).role !== Role.PARENT) redirect("/");

  return children;
}
