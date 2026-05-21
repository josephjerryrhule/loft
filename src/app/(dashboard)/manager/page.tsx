import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { getManagerStats, getRecentManagerActivities, getMonthlyEarningsData } from "@/app/actions/manager";
import { getMinimumPayoutAmount } from "@/app/actions/settings";
import { EarningsChart } from "@/components/dashboard/EarningsChart";
import { ActivityTable } from "@/components/dashboard/ActivityTable";
import { RequestPayoutDialog } from "@/components/dashboard/RequestPayoutDialog";
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
    select: { inviteCode: true, firstName: true }
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
        <Card className="border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden flex flex-col justify-center">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">Withdraw Funds</CardTitle>
                <CardDescription>Available for payout</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl mb-4 border border-emerald-100 dark:border-emerald-800/50 text-center">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">Total Balance</p>
                    <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">GHS {stats.approvedBalance.toFixed(2)}</p>
                </div>
                <RequestPayoutDialog 
                    availableBalance={stats.approvedBalance} 
                    minimumPayoutAmount={minimumPayoutAmount}
                />
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

