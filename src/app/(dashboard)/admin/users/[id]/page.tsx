import { getUserFullProfile } from "@/app/actions/admin";
import { getSystemSettings } from "@/app/actions/settings";
import { UserProfileDashboard } from "@/components/admin/UserProfileDashboard";
import { notFound } from "next/navigation";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  const resolvedParams = await params;
  const [user, settings, session] = await Promise.all([
    getUserFullProfile(resolvedParams.id),
    getSystemSettings(),
    auth()
  ]);

  if (!user) {
    notFound();
  }

  return (
    <UserProfileDashboard 
      user={user as any} 
      currency={settings?.currency || "GHS"} 
      viewerId={session?.user?.id}
      viewerRole={(session?.user as any)?.role}
    />
  );
}
