import { getUserFullProfile } from "@/app/actions/admin";
import { getSystemSettings } from "@/app/actions/settings";
import { UserProfileDashboard } from "@/components/admin/UserProfileDashboard";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeaderboardProfilePage({ params }: PageProps) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const [user, settings] = await Promise.all([
    getUserFullProfile(resolvedParams.id),
    getSystemSettings()
  ]);

  if (!user) {
    notFound();
  }

  const viewerRole = (session.user as any)?.role;

  return (
    <UserProfileDashboard
      user={user as any}
      currency={settings?.currency || "GHS"}
      backUrl="/leaderboard"
      backLabel="Back to Leaderboard"
      viewerId={session.user.id}
      viewerRole={viewerRole}
    />
  );
}
