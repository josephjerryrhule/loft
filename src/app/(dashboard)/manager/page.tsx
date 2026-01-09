import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { getManagerStats, getRecentManagerActivities, getMonthlyEarningsData } from "@/app/actions/manager";
import { EarningsChart } from "@/components/dashboard/EarningsChart";
import { ActivityTable } from "@/components/dashboard/ActivityTable";

export default async function ManagerDashboardPage() {
  const stats = await getManagerStats();
  const activities = await getRecentManagerActivities();
  const chartData = await getMonthlyEarningsData();

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamCount}</div>
            <p className="text-xs text-muted-foreground">Affiliates managed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {stats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Personal commissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">GHS {stats.teamEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Earned by your affiliates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">GHS {stats.pendingPayout.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Ready for payout</p>
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
