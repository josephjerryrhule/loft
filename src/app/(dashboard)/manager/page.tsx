import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { getManagerStats, getRecentManagerActivities, getMonthlyEarningsData } from "@/app/actions/manager";
import { getMinimumPayoutAmount } from "@/app/actions/settings";
import { EarningsChart } from "@/components/dashboard/EarningsChart";
import { ActivityTable } from "@/components/dashboard/ActivityTable";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TrendingUp, Users, DollarSign, Wallet, Clock, Zap, Target } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CopyInviteLinkButton } from "@/components/affiliate/CopyInviteLinkButton";
import { prisma } from "@/lib/prisma";
import { PremiumKPICard } from "@/components/dashboard/PremiumKPICard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DashboardTable } from "@/components/dashboard/DashboardTable";

// Force dynamic rendering - this page requires authentication and real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ManagerDashboardPage() {
  // Role protection - only managers can access
  const session = await auth();
  if (!session?.user || session.user.role !== "MANAGER") {
    redirect("/parent");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { inviteCode: true, firstName: true, payoutMethodType: true, payoutDetails: true }
  });

  const stats = await getManagerStats();
  const activities = await getRecentManagerActivities();
  const chartData = await getMonthlyEarningsData();
  const minimumPayoutAmount = await getMinimumPayoutAmount();

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title=""
        showGreeting
        userName={session.user.name || user?.firstName || "Manager"}
        actions={
          user?.inviteCode && (
            <div className="flex flex-wrap gap-2">
              <CopyInviteLinkButton 
                text={`/join/customer/${user.inviteCode}`} 
                label="Recruit Customer" 
              />
              <CopyInviteLinkButton 
                text={`/join/affiliate/${user.inviteCode}`} 
                label="Recruit Affiliate" 
              />
            </div>
          )
        }
      />
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <PremiumKPICard
          title="Marketing Tools"
          value="Active"
          description="QR Code & ID Badge"
          icon={Zap}
          theme="primary"
        />
        <PremiumKPICard
          title="My Team"
          value={stats.teamCount}
          description="Affiliates managed"
          icon={Users}
        />
        <PremiumKPICard
          title="Personal Earnings"
          value={`GHS ${stats.totalEarnings.toFixed(2)}`}
          description="From direct sales"
          icon={DollarSign}
        />
        <PremiumKPICard
          title="Team Earnings"
          value={`GHS ${stats.teamEarnings.toFixed(2)}`}
          description="From affiliate overrides"
          icon={TrendingUp}
          theme="success"
        />
        <PremiumKPICard
          title="Approved Balance"
          value={`GHS ${stats.approvedBalance.toFixed(2)}`}
          description="Ready for payout"
          icon={Wallet}
          className="border-b-4 border-b-emerald-500"
        />
        <PremiumKPICard
          title="Pending Balance"
          value={`GHS ${stats.pendingBalance.toFixed(2)}`}
          description="Awaiting approval"
          icon={Clock}
          className="border-b-4 border-b-amber-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Payout Card */}
        {/* Payout Settings & Statements Card */}
        <Card className="border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden flex flex-col justify-center">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">Automatic Payouts</CardTitle>
                <CardDescription>Earnings are processed weekly in-hand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {user?.payoutDetails ? (
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-left">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Registered Payout Method</p>
                        <p className="text-sm font-black text-slate-800 dark:text-stone-200 capitalize">{user.payoutMethodType === "momo" ? "Mobile Money" : "Bank Transfer"}</p>
                        <p className="text-xs text-slate-500 font-mono mt-1">{user.payoutDetails}</p>
                    </div>
                ) : (
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50 text-left">
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider mb-1">Configuration Needed</p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 leading-normal">Configure your Mobile Money or Bank details in settings to receive payouts.</p>
                    </div>
                )}
                <div className="flex gap-2">
                    <Link href="/manager/commissions?tab=payouts" className="flex-1">
                        <Button className="w-full bg-[#E87154] hover:bg-[#D66144] font-bold text-xs text-white rounded-xl h-10 shadow-md transition-all active:scale-95">
                            Payout Statements
                        </Button>
                    </Link>
                    <Link href="/settings">
                        <Button variant="outline" className="border-slate-200 hover:bg-slate-50 font-bold text-xs rounded-xl h-10 px-3">
                            Edit Settings
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>

        {/* Team Management Card */}
        <Card className="lg:col-span-2 border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden relative group">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold">Team Overview</CardTitle>
                        <CardDescription>Monitor and grow your network</CardDescription>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 flex items-center justify-center">
                        <Target size={20} />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500/20 transition-all">
                    <h4 className="font-bold text-sm mb-1 text-slate-900 dark:text-white">Active Affiliates</h4>
                    <p className="text-2xl font-black text-indigo-600 mb-2">{stats.teamCount}</p>
                    <Button asChild variant="outline" size="sm" className="w-full text-xs h-8">
                        <Link href="/manager/team">Manage Team</Link>
                    </Button>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/20 transition-all">
                    <h4 className="font-bold text-sm mb-1 text-slate-900 dark:text-white">Team Revenue</h4>
                    <p className="text-2xl font-black text-emerald-600 mb-2">GHS {stats.teamEarnings.toFixed(2)}</p>
                    <Button asChild variant="outline" size="sm" className="w-full text-xs h-8">
                        <Link href="/leaderboard">Leaderboard</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>
      
      {/* Full-width Chart */}
      <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg font-bold">Earnings Performance</CardTitle>
            <CardDescription>Monthly team and personal earnings</CardDescription>
          </div>
          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#E87154]">
             <TrendingUp size={16} />
          </div>
        </CardHeader>
        <CardContent>
          <EarningsChart data={chartData} />
        </CardContent>
      </Card>
      
      {/* Activities Table */}
      <DashboardTable
        title="Recent Activity"
        description="Latest team actions and commission events"
        icon={<Clock size={18} />}
      >
        <ActivityTable activities={activities} />
      </DashboardTable>
    </div>
  );
}

