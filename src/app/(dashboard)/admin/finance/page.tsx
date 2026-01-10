"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminCommissionActions, AdminPayoutActions } from "@/components/admin/AdminFinanceActions";
import { TablePagination } from "@/components/ui/table-pagination";
import { Loader2, CheckCircle2 } from "lucide-react";
import { getFinanceData, bulkApproveCommissions } from "@/app/actions/admin";
import { toast } from "sonner";


export default function AdminFinancePage() {
  const [stats, setStats] = useState<any>(null);
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [recentCommissions, setRecentCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutItemsPerPage, setPayoutItemsPerPage] = useState(12);
  const [commissionPage, setCommissionPage] = useState(1);
  const [commissionItemsPerPage, setCommissionItemsPerPage] = useState(12);

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      const data = await getFinanceData();
      setStats(data.stats);
      setPayoutRequests(data.payoutRequests);
      setRecentCommissions(data.recentCommissions);
    } catch (error) {
      console.error("Failed to load finance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    const pendingCount = recentCommissions.filter(c => c.status === "PENDING").length;
    
    if (pendingCount === 0) {
      toast.error("No pending commissions to approve");
      return;
    }

    if (!confirm(`Are you sure you want to approve all ${pendingCount} pending commissions?`)) {
      return;
    }

    setBulkApproving(true);
    try {
      const result = await bulkApproveCommissions();
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`Successfully approved ${result.approved} commissions totaling GHS ${result.totalAmount.toFixed(2)}`);
        await loadFinanceData();
      }
    } catch (error) {
      toast.error("Failed to approve commissions");
    } finally {
      setBulkApproving(false);
    }
  };

  const payoutTotalPages = Math.ceil(payoutRequests.length / payoutItemsPerPage);
  const payoutStartIndex = (payoutPage - 1) * payoutItemsPerPage;
  const paginatedPayouts = payoutRequests.slice(payoutStartIndex, payoutStartIndex + payoutItemsPerPage);

  const commissionTotalPages = Math.ceil(recentCommissions.length / commissionItemsPerPage);
  const commissionStartIndex = (commissionPage - 1) * commissionItemsPerPage;
  const paginatedCommissions = recentCommissions.slice(commissionStartIndex, commissionStartIndex + commissionItemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
              {paginatedPayouts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No pending payout requests.
                  </TableCell>
                </TableRow>
              )}
              {paginatedPayouts.map((req: any) => (
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
                    <AdminPayoutActions payout={req} onSuccess={loadFinanceData} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4">
            <TablePagination
              currentPage={payoutPage}
              totalPages={payoutTotalPages}
              itemsPerPage={payoutItemsPerPage}
              totalItems={payoutRequests.length}
              onPageChange={setPayoutPage}
              onItemsPerPageChange={(value) => {
                setPayoutItemsPerPage(value);
                setPayoutPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Commissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Commissions</CardTitle>
              <CardDescription>All commission entries</CardDescription>
            </div>
            {recentCommissions.some(c => c.status === "PENDING") && (
              <Button 
                onClick={handleBulkApprove}
                disabled={bulkApproving}
                className="gap-2"
              >
                {bulkApproving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Approve All Pending
              </Button>
            )}
          </div>
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
              {paginatedCommissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No commissions yet.
                  </TableCell>
                </TableRow>
              )}
              {paginatedCommissions.map((comm: any) => (
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
                    <AdminCommissionActions id={comm.id} status={comm.status} onSuccess={loadFinanceData} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4">
            <TablePagination
              currentPage={commissionPage}
              totalPages={commissionTotalPages}
              itemsPerPage={commissionItemsPerPage}
              totalItems={recentCommissions.length}
              onPageChange={setCommissionPage}
              onItemsPerPageChange={(value) => {
                setCommissionItemsPerPage(value);
                setCommissionPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
