"use server";

import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getAmbassadorPerformance } from "@/app/actions/leaderboard";
import { formatRole } from "@/lib/format-utils";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  CreditCard,
  Calendar,
  User,
  Shield,
  ArrowUpRight
} from "lucide-react";
import { EarningsChart } from "@/components/dashboard/EarningsChart";

export default async function AmbassadorProfilePage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  try {
    const data = await getAmbassadorPerformance(id);
    
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              <AvatarImage src={data.user.avatar || ""} />
              <AvatarFallback className="text-xl">{data.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{data.user.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">
                  {formatRole(data.user.role)}
                </Badge>
                <span className="text-sm text-muted-foreground">ID: {data.user.ambassadorId}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={data.user.status === "ACTIVE" ? "default" : "secondary"}>
              {data.user.status}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Joined {new Date(data.user.joinDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.metrics.totalSales}</div>
              <p className="text-xs text-muted-foreground">
                {data.metrics.subscriptionSales} Subs | {data.metrics.productSales} Products
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.metrics.totalRevenue !== null ? `GHS ${data.metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">Total value of sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Personal Earnings</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data.metrics.personalEarnings !== null ? `GHS ${data.metrics.personalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">Direct referral commissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Override Earnings</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {data.metrics.overrideEarnings !== null ? `GHS ${data.metrics.overrideEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">Team override commissions</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-7">
          {/* Performance Chart */}
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle>Performance History</CardTitle>
              <CardDescription>Earnings over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[300px]">
                <EarningsChart data={data.monthlyStats} />
              </div>
            </CardContent>
          </Card>

          {/* Team / Hierarchy Info */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Team Information</CardTitle>
              <CardDescription>Hierarchy and assignments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Manager</span>
                </div>
                <span className="text-sm">{data.user.manager || "Unassigned"}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Team Leader</span>
                </div>
                <span className="text-sm">{data.user.teamLeader || "Unassigned"}</span>
              </div>

              {data.team && (
                <div className="mt-6">
                  <h4 className="text-sm font-bold mb-3">Managed Team ({data.team.members.length})</h4>
                  <div className="space-y-2">
                    {data.team.members.slice(0, 5).map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{member.firstName} {member.lastName}</span>
                          <span className="text-xs text-muted-foreground">{member.ambassadorId}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] scale-90">
                          {member.role.toLowerCase()}
                        </Badge>
                      </div>
                    ))}
                    {data.team.members.length > 5 && (
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        + {data.team.members.length - 5} more members
                      </p>
                    )}
                    {data.team.members.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No team members assigned.</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales Activity</CardTitle>
            <CardDescription>Last 10 commission events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity found.</p>
              ) : (
                data.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border-b last:border-0">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium capitalize">{activity.type.replace('_', ' ').toLowerCase()}</span>
                      <span className="text-xs text-muted-foreground">{new Date(activity.date).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">GHS {activity.amount.toFixed(2)}</span>
                      <Badge variant={activity.status === "PENDING" ? "secondary" : "default"} className="text-[10px]">
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error loading ambassador profile:", error);
    notFound();
  }
}
