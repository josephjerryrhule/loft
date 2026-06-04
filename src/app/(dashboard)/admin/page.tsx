import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentActivityTable } from "@/components/admin/RecentActivityTable";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cache } from "@/lib/cache";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserLink } from "@/components/user/UserLink";
import { 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Plus, 
  DollarSign, 
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Target,
  BarChart3,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PremiumKPICard } from "@/components/dashboard/PremiumKPICard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DashboardTable } from "@/components/dashboard/DashboardTable";
import { getOperationsDashboardStats } from "@/app/actions/operations";
import { getLeaderboardData } from "@/app/actions/leaderboard";
import { getAffiliateStats } from "@/app/actions/affiliate";
import { Role } from "@/lib/types";
import { formatStatusLabel } from "@/lib/utils";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getStats() {
    const cacheKey = 'admin:stats';
    const cached = cache.get<{ totalUsers: number; totalOrders: number; totalFlipbooks: number; totalRevenue: number; totalSubscriptions: number; paidSubscriptions: number; freeSubscriptions: number; pendingPayout: number }>(cacheKey);
    if (cached) return cached;

    const [
        totalUsers,
        totalOrders,
        totalFlipbooks,
        totalSubscriptions,
        orderRevenue,
        activeSubscriptions,
        completedSubscriptions,
        pendingCommissions
    ] = await Promise.all([
        prisma.user.count(),
        prisma.order.count(),
        prisma.flipbook.count(),
        prisma.subscription.count({ where: { status: "ACTIVE" }}),
        prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { paymentStatus: { in: ["PAID", "COMPLETED"] } }
        }),
        prisma.subscription.findMany({
            where: { status: "ACTIVE" },
            include: { plan: true }
        }),
        prisma.subscription.findMany({
            where: { paymentStatus: { in: ["COMPLETED", "COMPLETED_FREE"] } },
            include: { plan: true }
        }),
        prisma.commission.aggregate({
            _sum: { amount: true },
            where: { status: "PENDING" }
        })
    ]);
    
    const subscriptionRevenue = completedSubscriptions.reduce((sum: number, sub: any) => sum + Number(sub.plan.price), 0);
    const totalRevenue = (orderRevenue._sum.totalAmount?.toNumber() || 0) + subscriptionRevenue;
    const pendingPayout = pendingCommissions._sum.amount?.toNumber() || 0;

    const paidSubscriptions = activeSubscriptions.filter((sub: any) => Number(sub.plan.price) > 0).length;
    const freeSubscriptions = activeSubscriptions.length - paidSubscriptions;

    const stats = { totalUsers, totalOrders, totalFlipbooks, totalRevenue, totalSubscriptions, paidSubscriptions, freeSubscriptions, pendingPayout };
    cache.set(cacheKey, stats, 300000);
    return stats;
}

async function getMonthlyRevenueData() {
    const cacheKey = 'admin:monthly-revenue';
    const cached = cache.get<{ name: string; total: number }[]>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const monthDates = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        monthDates.push({ date, endDate, name: date.toLocaleString('default', { month: 'short' }) });
    }

    const monthlyData = await Promise.all(
        monthDates.map(async ({ date, endDate, name }) => {
            const [orderRevenue, subscriptions] = await Promise.all([
                prisma.order.aggregate({
                    where: {
                        paymentStatus: { in: ["PAID", "COMPLETED"] },
                        createdAt: { gte: date, lte: endDate }
                    },
                    _sum: { totalAmount: true }
                }),
                prisma.subscription.findMany({
                    where: {
                        paymentStatus: { in: ["COMPLETED", "COMPLETED_FREE"] },
                        createdAt: { gte: date, lte: endDate }
                    },
                    include: { plan: true }
                })
            ]);

            const subRevenue = subscriptions.reduce((sum: number, sub: any) => sum + Number(sub.plan.price), 0);
            return {
                name,
                total: (orderRevenue._sum.totalAmount?.toNumber() || 0) + subRevenue
            };
        })
    );

    cache.set(cacheKey, monthlyData, 600000);
    return monthlyData;
}

async function getRecentActivity() {
    const cacheKey = 'admin:recent-activity';
    const cached = cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const activities = await prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { 
            user: { 
                select: { 
                    id: true, 
                    email: true, 
                    firstName: true, 
                    lastName: true, 
                    profilePictureUrl: true 
                } 
            } 
        }
    });
    
    cache.set(cacheKey, activities, 120000);
    return activities;
}

async function getRecentSales() {
    const cacheKey = 'admin:recent-sales';
    const cached = cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const sales = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { 
            customer: { 
                select: { 
                    id: true, 
                    email: true, 
                    firstName: true, 
                    lastName: true, 
                    profilePictureUrl: true 
                } 
            }, 
            product: { 
                select: { 
                    id: true, 
                    title: true, 
                    price: true 
                } 
            } 
        }
    });
    
    cache.set(cacheKey, sales, 120000);
    return sales;
}

export default async function AdminDashboardPage() {
  const session = await auth();
  // @ts-ignore
  const role = session?.user?.role;
  if (!session?.user || (role !== Role.ADMIN && role !== Role.OPERATIONS_MANAGER)) {
    redirect("/parent");
  }

  const isOpsManager = role === Role.OPERATIONS_MANAGER;

  const [stats, revenueData, recentActivity, recentSales, opsStats, topAmbassadors, myStats] = await Promise.all([
    getStats(),
    getMonthlyRevenueData(),
    getRecentActivity(),
    getRecentSales(),
    isOpsManager ? getOperationsDashboardStats() : Promise.resolve(null),
    isOpsManager ? getLeaderboardData({}).then(data => data.slice(0, 5)) : Promise.resolve([]),
    isOpsManager ? getAffiliateStats() : Promise.resolve(null)
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title=""
        showGreeting
        userName={session.user.name || "Admin"}
        actions={
          <>
            {isOpsManager && myStats && (
                <Button asChild className="bg-[#E87154] hover:bg-[#D66144] shadow-lg shadow-[#E87154]/20 h-12 px-8 rounded-2xl font-black transition-all active:scale-95">
                  <Link href="/admin/commissions?tab=payouts" className="flex items-center gap-3">
                    <Wallet size={20} /> Payout Statements
                  </Link>
                </Button>
            )}
            {!isOpsManager && (
                <Button asChild className="bg-[#E87154] hover:bg-[#D66144] shadow-lg shadow-[#E87154]/20 h-12 px-8 rounded-2xl font-black transition-all active:scale-95">
                  <Link href="/admin/flipbooks" className="flex items-center gap-3">
                    <Plus size={20} /> New Flipbook
                  </Link>
                </Button>
            )}
            <Button asChild variant="outline" className="h-12 px-8 rounded-2xl font-black border-2 border-slate-100 hover:bg-slate-50 transition-all active:scale-95">
              <Link href="/admin/users" className="flex items-center gap-3">
                <Users size={20} /> Manage Users
              </Link>
            </Button>
            {isOpsManager && (
                 <Button asChild className="bg-[#E87154] hover:bg-[#D66144] shadow-lg shadow-[#E87154]/20 h-12 px-8 rounded-2xl font-black transition-all active:scale-95">
                    <Link href="/admin/ambassadors" className="flex items-center gap-3">
                        <Target size={20} /> Manage Ambassadors
                    </Link>
                 </Button>
            )}
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PremiumKPICard
          title={isOpsManager ? "System Revenue" : "Total Revenue"}
          value={`GHS ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          theme="primary"
          icon={DollarSign}
          trend={{ value: "Trending Up", label: "All time earnings", type: "up" }}
        />

        {isOpsManager && opsStats ? (
            <PremiumKPICard
                title="Total Ambassadors"
                value={opsStats.totalAmbassadors.toLocaleString()}
                description={`${opsStats.totalManagers} Managers, ${opsStats.totalTeamLeaders} TLs`}
                icon={Target}
                theme="info"
            />
        ) : (
            <PremiumKPICard
                title="Total Users"
                value={stats.totalUsers.toLocaleString()}
                description="Active platform users"
                icon={Users}
            />
        )}

        <PremiumKPICard
          title={isOpsManager ? "My Earnings" : "Active Subscriptions"}
          value={isOpsManager && myStats ? `GHS ${myStats.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : stats.totalSubscriptions}
          icon={isOpsManager ? Wallet : CreditCard}
          className={!isOpsManager ? "border-b-4 border-b-[#E87154]" : ""}
          description={isOpsManager ? "Total personal commissions" : `${stats.paidSubscriptions} Paid, ${stats.freeSubscriptions} Free`}
          theme={isOpsManager ? "success" : "white"}
        />

        <PremiumKPICard
          title={isOpsManager ? "My Pending Payouts" : "Pending Payouts"}
          value={isOpsManager && myStats ? `GHS ${myStats.pendingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `GHS ${stats.pendingPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          description={isOpsManager ? "Awaiting disbursement" : "Commissions to pay"}
          icon={Clock}
          className="border-b-4 border-b-amber-500"
        />
      </div>

      {isOpsManager && topAmbassadors.length > 0 && (
          <DashboardTable
            title="Top Performers"
            description="Highest performing ambassadors across the system"
            icon={<TrendingUp size={18} />}
            actions={
                <Link href="/leaderboard" className="text-xs font-bold text-[#E87154] hover:underline flex items-center">
                    Full Leaderboard <ArrowUpRight size={12} className="ml-0.5" />
                </Link>
            }
          >
             <div className="divide-y divide-slate-100">
                 {topAmbassadors.map((entry: any) => (
                     <div key={entry.id} className="flex items-center justify-between p-4 hover:bg-slate-50:bg-slate-800/50 transition-colors">
                         <div className="flex items-center gap-3">
                             <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-xs font-black">
                                 #{entry.rank}
                             </div>
                              <UserLink
                                  userId={entry.id}
                                  status={entry.status}
                                  className="flex items-center gap-3 hover:opacity-85 transition-opacity"
                              >
                                  <Avatar className="h-9 w-9 border-2 border-white shadow-sm cursor-pointer">
                                      <AvatarImage src={entry.avatar || ""} alt={entry.name} />
                                      <AvatarFallback className="text-[10px] font-bold">{entry.name[0]}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                      <p className="text-sm font-bold text-slate-900 hover:underline cursor-pointer">{entry.name}</p>
                                      <p className="text-[10px] text-slate-500">{entry.role}</p>
                                  </div>
                              </UserLink>
                         </div>
                         <div className="text-right">
                             <p className="text-xs font-black text-slate-900">{entry.salesCount} Sales</p>
                             <p className="text-[10px] text-emerald-600 font-bold">GHS {entry.revenue?.toFixed(2) || "0.00"}</p>
                         </div>
                     </div>
                 ))}
             </div>
          </DashboardTable>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-none shadow-md overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-bold">Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue over the last 6 months</CardDescription>
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[#E87154]">
               <TrendingUp size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueData} />
          </CardContent>
        </Card>

        {/* Recent Sales List */}
        <DashboardTable
          title="Recent Sales"
          description="Latest platform orders"
          icon={<ShoppingBag size={18} />}
          actions={
            <Link href="/admin/orders" className="text-xs font-bold text-[#E87154] hover:underline flex items-center">
               View All <ArrowUpRight size={12} className="ml-0.5" />
            </Link>
          }
        >
          {recentSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
               <ShoppingBag size={40} className="mb-2 opacity-20" />
               <p className="text-sm">No sales yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentSales.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-4 hover:bg-slate-50:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <UserLink
                      userId={order.customer.id}
                      status={order.customer.status}
                      className="flex items-center gap-3 hover:opacity-85 transition-opacity"
                    >
                      <Avatar className="h-9 w-9 border-2 border-white shadow-sm cursor-pointer">
                        <AvatarImage src={order.customer.profilePictureUrl || ""} alt="Avatar" />
                        <AvatarFallback className="bg-slate-100 text-[10px] font-bold">
                          {order.customer.firstName?.[0] || order.customer.email[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate text-slate-900">{order.product.title}</p>
                        <p className="text-[10px] text-slate-500 truncate hover:underline cursor-pointer">{order.customer.email}</p>
                      </div>
                    </UserLink>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-black text-emerald-600">+GHS {Number(order.totalAmount).toFixed(2)}</p>
                    <Badge variant="outline" className="text-[9px] h-3.5 px-1 bg-emerald-50 text-emerald-600 border-emerald-500/20">
                      {formatStatusLabel(order.paymentStatus)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardTable>
      </div>

      {/* Recent Activity Section */}
      <DashboardTable
        title="Platform Activity"
        description="Real-time audit log of system events"
        icon={<ShieldCheck size={18} />}
        actions={
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-[#E87154]" asChild>
             <Link href="/admin/activity">View Audit Log</Link>
          </Button>
        }
      >
        <RecentActivityTable activities={recentActivity} />
      </DashboardTable>
    </div>
  );
}
