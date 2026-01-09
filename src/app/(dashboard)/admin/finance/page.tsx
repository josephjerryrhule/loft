import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminCommissionActions, AdminPayoutActions } from "@/components/admin/AdminFinanceActions";

async function getFinanceStats() {
    // Total commissions paid
    const paidCommissions = await prisma.commission.aggregate({
        _sum: { amount: true },
        where: { status: "PAID" }
    });

    // Pending commissions
    const pendingCommissions = await prisma.commission.aggregate({
        _sum: { amount: true },
        where: { status: "PENDING" }
    });

    // Approved (ready to pay)
    const approvedCommissions = await prisma.commission.aggregate({
        _sum: { amount: true },
        where: { status: "APPROVED" }
    });

    // Total revenue from orders
    const orderRevenue = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: "COMPLETED" as any }
    });

    // Total revenue from subscriptions
    const subscriptions = await prisma.subscription.findMany({
        include: { plan: true }
    });
    const subscriptionRevenue = subscriptions.reduce((sum: number, sub: any) => sum + Number(sub.plan.price), 0);

    const totalRevenue = (orderRevenue._sum.totalAmount?.toNumber() || 0) + subscriptionRevenue;

    // Active subscriptions count
    const activeSubscriptions = await prisma.subscription.count({
        where: { status: "ACTIVE" }
    });

    return {
        paidCommissions: paidCommissions._sum.amount?.toNumber() || 0,
        pendingCommissions: pendingCommissions._sum.amount?.toNumber() || 0,
        approvedCommissions: approvedCommissions._sum.amount?.toNumber() || 0,
        totalRevenue,
        activeSubscriptions
    };
}

export default async function AdminFinancePage() {
  const stats = await getFinanceStats();
  
  const payoutRequests = await prisma.payoutRequest.findMany({
      include: { user: true },
      orderBy: { requestedAt: 'desc' }
  });

  const recentCommissions = await prisma.commission.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 20
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Finance & Payouts</h1>

      {/* Finance KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              GHS {stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">From completed orders</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Commissions Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              GHS {stats.paidCommissions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Total paid to affiliates/managers</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              GHS {stats.pendingCommissions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ready to Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              GHS {stats.approvedCommissions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Approved commissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Requests</CardTitle>
          <CardDescription>Requests from affiliates and managers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payoutRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No pending payout requests.
                  </TableCell>
                </TableRow>
              )}
              {payoutRequests.map((req: any) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{req.user.role}</Badge>
                  </TableCell>
                  <TableCell>GHS {Number(req.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={req.status === "PAID" ? "default" : req.status === "APPROVED" ? "secondary" : "outline"}>
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(req.requestedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <AdminPayoutActions id={req.id} status={req.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Commissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Commissions</CardTitle>
          <CardDescription>All commission entries</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentCommissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No commissions yet.
                  </TableCell>
                </TableRow>
              )}
              {recentCommissions.map((comm: any) => (
                <TableRow key={comm.id}>
                  <TableCell className="font-medium">{comm.user?.email || "Unknown"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {comm.sourceType === "SIGNUP" ? "Signup Bonus" : 
                       comm.sourceType === "SUBSCRIPTION" ? "Subscription" : 
                       comm.sourceType === "PRODUCT" ? "Sale" : comm.sourceType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">GHS {Number(comm.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={comm.status === "PAID" ? "default" : comm.status === "APPROVED" ? "secondary" : "outline"}>
                      {comm.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(comm.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <AdminCommissionActions id={comm.id} status={comm.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
