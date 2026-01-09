import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

async function getStats() {
    const totalUsers = await prisma.user.count();
    const totalOrders = await prisma.order.count();
    const totalFlipbooks = await prisma.flipbook.count();
    
    // Calculate total revenue
    const revenueResult = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: "COMPLETED" } 
    });
    const totalRevenue = revenueResult._sum.totalAmount?.toNumber() || 0;

    return { totalUsers, totalOrders, totalFlipbooks, totalRevenue };
}

async function getRecentRevenueData() {
    const orders = await prisma.order.findMany({
        where: { paymentStatus: { not: "CANCELLED" } },
        orderBy: { createdAt: 'desc' },
        take: 50, 
        select: { createdAt: true, totalAmount: true }
    });

    const dailyRevenue: Record<string, number> = {};
    
    // @ts-ignore - Prisma inference might be flaky if client not fully synced
    orders.forEach((order: any) => {
        const date = order.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailyRevenue[date] = (dailyRevenue[date] || 0) + order.totalAmount.toNumber();
    });

    const chartData = Object.entries(dailyRevenue)
        .map(([name, total]) => ({ name, total }))
        .reverse(); 

    if (chartData.length === 0) {
        return [
            { name: "Jan 1", total: 0 },
            { name: "Jan 2", total: 0 },
            { name: "Jan 3", total: 0 },
        ];
    }
    
    return chartData;
}

async function getRecentActivity() {
    return await prisma.activityLog.findMany({
        take: 5,
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
  const revenueData = await getRecentRevenueData();
  const recentActivity = await getRecentActivity();
  const recentSales = await getRecentSales();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHS {stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
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
            <CardTitle className="text-sm font-medium">Flipbooks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFlipbooks}</div>
            <p className="text-xs text-muted-foreground">Published content</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Total orders placed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Revenue</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
             <div className="h-[300px]">
                <RevenueChart data={revenueData} />
             </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
              {recentSales.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sales yet.</p>
              ) : (
                <div className="space-y-8">
                    {/* @ts-ignore */}
                    {recentSales.map((order: any) => (
                        <div key={order.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={order.customer.profilePictureUrl || ""} alt="Avatar" />
                                <AvatarFallback>{order.customer.firstName?.[0] || order.customer.email[0]}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{order.product.title}</p>
                                <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                            </div>
                            <div className="ml-auto font-medium">+GHS {order.totalAmount.toString()}</div>
                        </div>
                    ))}
                </div>
              )}
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Time</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                     {recentActivity.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                No recent activity logged.
                            </TableCell>
                        </TableRow>
                    )}
                    {/* @ts-ignore */}
                    {recentActivity.map((log: any) => (
                        <TableRow key={log.id}>
                            <TableCell className="font-medium">{log.user?.email || "System"}</TableCell>
                            <TableCell>{log.actionType}</TableCell>
                            <TableCell>{log.actionDetails}</TableCell>
                            <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
      </Card>
    </div>
  );
}
