import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@/lib/types";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // @ts-ignore - role exists on session.user
  const role = session.user.role;

  switch (role) {
    case Role.ADMIN:
      redirect("/admin");
    case Role.MANAGER:
      redirect("/manager");
    case Role.AFFILIATE:
      redirect("/affiliate");
    case Role.CUSTOMER:
      redirect("/customer");
    default:
      redirect("/auth/login"); // Fallback
  }
}
