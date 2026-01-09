import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { getAffiliateStats, getRecentAffiliateActivities, getAffiliateMonthlyEarningsData } from "@/app/actions/affiliate";
import { getMinimumPayoutAmount } from "@/app/actions/settings";
import { EarningsChart } from "@/components/dashboard/EarningsChart";
import { ActivityTable } from "@/components/dashboard/ActivityTable";
import { CopyInviteLinkButton } from "@/components/affiliate/CopyInviteLinkButton";
import { RequestPayoutDialog } from "@/components/dashboard/RequestPayoutDialog";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function AffiliateDashboardPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { inviteCode: true }
  });
  
  const stats = await getAffiliateStats();
  const activities = await getRecentAffiliateActivities();
  const chartData = await getAffiliateMonthlyEarningsData();
  const minimumPayoutAmount = await getMinimumPayoutAmount();

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Affiliate Dashboard</h1>
          {user?.inviteCode && (
            <CopyInviteLinkButton 
              text={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/customer/${user.inviteCode}`} 
              label="Copy Invite link" 
            />
          )}
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.referralsCount}</div>
            <p className="text-xs text-muted-foreground">Customers signed up</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {stats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {stats.monthEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Earnings this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">GHS {stats.approvedBalance.toFixed(2)}</div>
             <p className="text-xs text-muted-foreground">Ready for payout</p>
             <div className="mt-2">
                <RequestPayoutDialog 
                  availableBalance={stats.approvedBalance} 
                  minimumPayoutAmount={minimumPayoutAmount}
                />
             </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">GHS {stats.pendingBalance.toFixed(2)}</div>
             <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Full-width Chart */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Earnings Overview</CardTitle>
          <CardDescription>Monthly earnings performance</CardDescription>
        </CardHeader>
        <CardContent>
          <EarningsChart data={chartData} />
        </CardContent>
      </Card>
      
      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions and events</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityTable activities={activities} />
        </CardContent>
      </Card>
    </div>
  );
}
