import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function ChildLoginPage() {
  redirect("/auth/login?type=child");
}
