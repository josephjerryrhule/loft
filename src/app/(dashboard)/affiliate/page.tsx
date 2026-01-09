import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";

export default function AffiliateDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Affiliate Dashboard</h1>
          <Button><Link2 className="mr-2 h-4 w-4"/> Copy Invite Link</Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Customers signed up</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS 0.00</div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS 0.00</div>
             <p className="text-xs text-muted-foreground">Minimum payout: GHS 50</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
