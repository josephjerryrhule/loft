import { auth } from "@/auth";
import { Role } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/auth/login");
  
  const role = (session.user as { role?: string }).role;
  if (role !== Role.CUSTOMER && role !== Role.PARENT) redirect("/");

  return children;
}
