import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@/lib/types";

// Force dynamic rendering - this page checks authentication
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // @ts-ignore - role exists on session.user
  const role = session.user.role;

  switch (role) {
    case "ADMIN":
    case "OPERATIONS_MANAGER":
      redirect("/admin");
      break;
    case "MANAGER":
      redirect("/manager");
      break;
    case "TEAM_LEADER":
    case "AFFILIATE":
      redirect("/affiliate");
      break;
    case "PARENT":
      redirect("/parent");
      break;
    case "CUSTOMER":
      redirect("/customer");
      break;
    case "FINANCE":
      redirect("/finance");
      break;
    default:
      redirect("/auth/login"); // Fallback
  }
}
