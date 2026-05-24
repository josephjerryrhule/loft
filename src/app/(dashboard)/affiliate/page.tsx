import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { getAffiliateStats, getRecentAffiliateActivities, getAffiliateMonthlyEarningsData } from "@/app/actions/affiliate";
import { getTeamLeaderStats } from "@/app/actions/team-leader";
import { getMinimumPayoutAmount } from "@/app/actions/settings";
import { EarningsChart } from "@/components/dashboard/EarningsChart";
import { ActivityTable } from "@/components/dashboard/ActivityTable";
import { CopyInviteLinkButton } from "@/components/affiliate/CopyInviteLinkButton";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TrendingUp, Users, DollarSign, Wallet, Clock, Zap, Target } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PremiumKPICard } from "@/components/dashboard/PremiumKPICard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DashboardTable } from "@/components/dashboard/DashboardTable";
import { Role } from "@/lib/types";

// Force dynamic rendering - this page requires authentication and real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AffiliateDashboardPage() {
  const session = await auth();
  
  // Role protection - only affiliates and team leaders can access
  // @ts-ignore
  const role = session?.user?.role;
  if (!session?.user || (role !== Role.AFFILIATE && role !== Role.TEAM_LEADER)) {
    redirect("/parent");
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { inviteCode: true, firstName: true, payoutMethodType: true, payoutDetails: true }
  });
  
  const stats = await getAffiliateStats();
  const teamStats = role === Role.TEAM_LEADER ? await getTeamLeaderStats() : null;
  const activities = await getRecentAffiliateActivities();
  const chartData = await getAffiliateMonthlyEarningsData();
  const minimumPayoutAmount = await getMinimumPayoutAmount();

  if (!stats) return <div>Loading...</div>;

  const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXTAUTH_URL || '';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title=""
        showGreeting
        userName={session.user.name || user?.firstName || (role === Role.TEAM_LEADER ? "Team Leader" : "Affiliate")}
        actions={
          user?.inviteCode && (
            <CopyInviteLinkButton 
              text={`${origin}/join/customer/${user.inviteCode}`} 
              label="Copy Invite link" 
            />
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
          trend={{ value: "Ready", label: "Tools", type: "neutral" }}
        />
        <PremiumKPICard
          title={role === Role.TEAM_LEADER ? "My Sales" : "My Referrals"}
          value={stats.referralsCount}
          description="Customers signed up"
          icon={Users}
        />
        {role === Role.TEAM_LEADER && teamStats && (
            <PremiumKPICard
                title="My Team"
                value={teamStats.teamCount}
                description="Affiliates assigned"
                icon={Target}
                theme="info"
            />
        )}
        <PremiumKPICard
          title="Total Earnings"
          value={`GHS ${stats.totalEarnings.toFixed(2)}`}
          description="Lifetime earnings"
          icon={DollarSign}
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
        {!teamStats && (
             <PremiumKPICard
             title="This Month"
             value={`GHS ${stats.monthEarnings.toFixed(2)}`}
             description="Earnings this month"
             icon={TrendingUp}
           />
        )}
      </div>

      <div className="grid gap-6">
        <div className="grid gap-6 lg:grid-cols-3">
            {/* Payout Settings & Statements Card */}
            <Card className="border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden flex flex-col justify-center">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold">Automatic Payouts</CardTitle>
                    <CardDescription>Earnings are processed weekly in-hand</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {user?.payoutDetails ? (
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Registered Payout Method</p>
                            <p className="text-sm font-black text-slate-800 dark:text-stone-200 capitalize">{user.payoutMethodType === "momo" ? "Mobile Money" : "Bank Transfer"}</p>
                            <p className="text-xs text-slate-500 font-mono mt-1">{user.payoutDetails}</p>
                        </div>
                    ) : (
                        <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50">
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider mb-1">Configuration Needed</p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 leading-normal">Configure your Mobile Money or Bank details in settings to receive payouts.</p>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Link href="/affiliate/commissions?tab=payouts" className="flex-1">
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

            {/* Team Leader Special Card */}
            {role === Role.TEAM_LEADER && teamStats ? (
                <Card className="lg:col-span-2 border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden relative group">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">Team Performance</CardTitle>
                                <CardDescription>Monitor your assigned affiliates</CardDescription>
                            </div>
                            <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 flex items-center justify-center">
                                <Target size={20} />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500/20 transition-all">
                            <h4 className="font-bold text-sm mb-1 text-slate-900 dark:text-white">Team Size</h4>
                            <p className="text-2xl font-black text-indigo-600 mb-2">{teamStats.teamCount} Affiliates</p>
                            <Button asChild variant="outline" size="sm" className="w-full text-xs h-8">
                                <Link href="/team-leader/team">Manage Team</Link>
                            </Button>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/20 transition-all">
                            <h4 className="font-bold text-sm mb-1 text-slate-900 dark:text-white">Team Sales</h4>
                            <p className="text-2xl font-black text-emerald-600 mb-2">{teamStats.teamSalesCount} Total</p>
                            <Button asChild variant="outline" size="sm" className="w-full text-xs h-8">
                                <Link href="/leaderboard">Leaderboard</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                /* Regular Affiliate Quick Actions */
                <Card className="lg:col-span-2 border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden relative group">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold">Marketing Toolkit</CardTitle>
                        <CardDescription>Resources to help you grow your network</CardDescription>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#E87154]/20 transition-colors">
                            <div className="h-10 w-10 rounded-lg bg-[#E87154]/10 text-[#E87154] flex items-center justify-center mb-3">
                                <Zap size={20} />
                            </div>
                            <h4 className="font-bold text-sm mb-1">Brand Assets</h4>
                            <p className="text-xs text-slate-500 mb-3">Download logos and marketing images.</p>
                            <Button asChild variant="outline" size="sm" className="w-full text-xs h-8">
                                <Link href="/affiliate/marketing">Get Assets</Link>
                            </Button>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#E87154]/20 transition-colors">
                            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/10 text-blue-600 flex items-center justify-center mb-3">
                                <TrendingUp size={20} />
                            </div>
                            <h4 className="font-bold text-sm mb-1">Leaderboard</h4>
                            <p className="text-xs text-slate-500 mb-3">See how you rank against others.</p>
                            <Button asChild variant="outline" size="sm" className="w-full text-xs h-8">
                                <Link href="/leaderboard">View Rankings</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
      
        {/* Full-width Chart */}
        <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                    <CardTitle className="text-lg font-bold">Earnings Overview</CardTitle>
                    <CardDescription>Monthly earnings performance</CardDescription>
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
            description="Latest actions and events"
            icon={<Clock size={18} />}
        >
            <ActivityTable activities={activities} />
        </DashboardTable>
      </div>
    </div>
  );
}


