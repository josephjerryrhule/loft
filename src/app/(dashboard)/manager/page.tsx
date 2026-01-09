import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ManagerDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Affiliates managed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS 0.00</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS 0.00</div>
            <p className="text-xs text-muted-foreground">Available balance</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
