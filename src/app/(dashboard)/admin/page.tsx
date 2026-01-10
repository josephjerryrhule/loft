import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PaymentStatus } from "@/lib/types";
import { RecentActivityTable } from "@/components/admin/RecentActivityTable";

// Force dynamic rendering - this page requires authentication and real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getStats() {
    const totalUsers = await prisma.user.count();
    const totalOrders = await prisma.order.count();
    const totalFlipbooks = await prisma.flipbook.count();
    const totalSubscriptions = await prisma.subscription.count({ where: { status: "ACTIVE" }});
    
    // Calculate total revenue from orders
    const orderRevenue = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: { in: ["PAID", "COMPLETED"] } } 
    });
    
    // Calculate total revenue from subscriptions
    // Since there's no paymentStatus on Subscription, we count ALL that have a plan with a price
    const subscriptions = await prisma.subscription.findMany({
        include: { plan: true }
    });
    const subscriptionRevenue = subscriptions.reduce((sum: number, sub: any) => sum + Number(sub.plan.price), 0);
    
    // Calculate pending commissions
    const pendingCommissions = await prisma.commission.aggregate({
        _sum: { amount: true },
        where: { status: "PENDING" }
    });
    
    const totalRevenue = (orderRevenue._sum.totalAmount?.toNumber() || 0) + subscriptionRevenue;
    const pendingPayout = pendingCommissions._sum.amount?.toNumber() || 0;

    return { totalUsers, totalOrders, totalFlipbooks, totalRevenue, totalSubscriptions, pendingPayout };
}

async function getMonthlyRevenueData() {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const revenue = await prisma.order.aggregate({
            where: {
                paymentStatus: { in: ["PAID", "COMPLETED"] },
                createdAt: {
                    gte: date,
                    lte: endDate
                }
            },
            _sum: { totalAmount: true }
        });

        // Add subscription revenue for this month
        const monthlySubscriptions = await prisma.subscription.findMany({
            where: {
                createdAt: {
                    gte: date,
                    lte: endDate
                }
            },
            include: { plan: true }
        });
        const subRevenue = monthlySubscriptions.reduce((sum: number, sub: any) => sum + Number(sub.plan.price), 0);

        months.push({
            name: date.toLocaleString('default', { month: 'short' }),
            total: (revenue._sum.totalAmount?.toNumber() || 0) + subRevenue
        });
    }

    return months;
}

async function getRecentActivity() {
    return await prisma.activityLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: { user: true }
    });
}

async function getRecentSales() {
    return await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: true, product: true }
    });
}

export default async function AdminDashboardPage() {
  const stats = await getStats();
  const revenueData = await getMonthlyRevenueData();
  const recentActivity = await getRecentActivity();
  const recentSales = await getRecentSales();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">GHS {stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Active platform users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
            <p className="text-xs text-muted-foreground">Paying customers</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">GHS {stats.pendingPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Commissions to pay</p>
          </CardContent>
        </Card>
      </div>

      {/* Full-width Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Monthly revenue over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart data={revenueData} />
        </CardContent>
      </Card>

      {/* Full-width Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>Latest orders placed on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {recentSales.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No sales yet.</p>
          ) : (
            <div className="space-y-4">
              {recentSales.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={order.customer.profilePictureUrl || ""} alt="Avatar" />
                      <AvatarFallback>{order.customer.firstName?.[0] || order.customer.email[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{order.product.title}</p>
                      <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={order.paymentStatus === "COMPLETED" ? "default" : "secondary"}>
                      {order.paymentStatus}
                    </Badge>
                    <span className="font-bold text-green-600">+GHS {Number(order.totalAmount).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <RecentActivityTable activities={recentActivity} />
        </CardContent>
      </Card>
    </div>
  );
}
