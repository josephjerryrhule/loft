"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLeaderboardData } from "@/app/actions/leaderboard";
import LeaderboardClient from "./LeaderboardClient";

import { getSystemSettings } from "@/app/actions/settings";

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const role = (session.user as any).role;
  const isHighLevel = role === "ADMIN" || role === "OPERATIONS_MANAGER";
  
  const settings = await getSystemSettings();
  const isVisible = settings.leaderboardVisible === "true" || settings.leaderboardVisible === true;

  if (!isVisible && !isHighLevel) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <h1 className="text-2xl font-bold">Leaderboard Hidden</h1>
        <p className="text-muted-foreground">The platform leaderboard is currently private.</p>
      </div>
    );
  }

  const initialData = await getLeaderboardData({});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ambassador Leaderboard</h1>
        <p className="text-muted-foreground">Track performance and rankings across the platform.</p>
      </div>

      <LeaderboardClient initialData={initialData} viewerRole={(session.user as any).role} />
    </div>
  );
}
