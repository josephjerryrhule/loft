import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@/lib/types";

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // @ts-ignore
  const userRole = session.user.role;

  if (userRole !== Role.FINANCE) {
    // Non-finance users are not allowed here — redirect to their own dashboard
    redirect("/auth/login");
  }

  return <>{children}</>;
}
