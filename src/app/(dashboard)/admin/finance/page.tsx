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
import { PremiumKPICard } from "@/components/dashboard/PremiumKPICard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DollarSign, Wallet, TrendingUp, Clock, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";


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

  useEffect(() => {
    loadFinanceData();
  }, []);

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Finance & Payouts"
        subtitle="Manage ambassador commissions, payout requests, and system revenue"
      />

      {/* Finance KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PremiumKPICard
          title="Total Revenue"
          value={`GHS ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          theme="primary"
          trend={{ value: "From orders", label: "Completed sales", type: "up" }}
        />
        <PremiumKPICard
          title="Commissions Paid"
          value={`GHS ${stats.paidCommissions.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={CheckCircle2}
          theme="success"
          description="Total paid to ambassadors"
        />
        <PremiumKPICard
          title="Pending Approval"
          value={`GHS ${stats.pendingCommissions.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={Clock}
          theme="warning"
          description="Awaiting admin review"
        />
        <PremiumKPICard
          title="Approved (Ready)"
          value={`GHS ${stats.approvedCommissions.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={Wallet}
          theme="info"
          description="Ready for payout"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-1">
        {/* Payout Requests */}
        <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-bold">Payout Requests</CardTitle>
                    <CardDescription>Withdrawal requests from ambassadors</CardDescription>
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                    <Wallet size={20} />
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="pl-6">Ambassador</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPayouts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                      No pending payout requests.
                    </TableCell>
                  </TableRow>
                )}
                {paginatedPayouts.map((req: any) => (
                  <TableRow key={req.id} className="group transition-colors">
                    <TableCell className="pl-6 font-bold text-slate-900 dark:text-white">{req.user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-800 border-none">
                        {req.user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-black text-slate-900 dark:text-white">
                        <span className="text-[10px] text-slate-400 mr-1">GHS</span>
                        {Number(req.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={req.status === "PAID" ? "default" : req.status === "APPROVED" ? "secondary" : "outline"}
                        className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            req.status === "PAID" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none",
                            req.status === "APPROVED" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none",
                            req.status === "PENDING" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none"
                        )}
                      >
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                        {new Date(req.requestedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <AdminPayoutActions payout={req} onSuccess={loadFinanceData} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 border-t border-slate-50 dark:border-slate-800">
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
        <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Recent Commissions</CardTitle>
                <CardDescription>Audit log of all earned commissions</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {recentCommissions.some(c => c.status === "PENDING") && (
                <Button 
                    onClick={handleBulkApprove}
                    disabled={bulkApproving}
                    size="sm"
                    className="gap-2 bg-[#E87154] hover:bg-[#D66144] shadow-lg shadow-[#E87154]/20"
                >
                    {bulkApproving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                    <CheckCircle2 className="h-4 w-4" />
                    )}
                    Approve All Pending
                </Button>
                )}
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#E87154]">
                    <TrendingUp size={20} />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="pl-6">Recipient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCommissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                      No commissions yet.
                    </TableCell>
                  </TableRow>
                )}
                {paginatedCommissions.map((comm: any) => (
                  <TableRow key={comm.id} className="group transition-colors">
                    <TableCell className="pl-6 font-bold text-slate-900 dark:text-white">{comm.user?.email || "Unknown"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-800 border-none">
                        {comm.sourceType === "SIGNUP" ? "Signup Bonus" : 
                         comm.sourceType === "SUBSCRIPTION" ? "Subscription" : 
                         comm.sourceType === "PRODUCT" ? "Sale" : comm.sourceType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-black text-emerald-600">
                        <span className="text-[10px] opacity-70 mr-1">GHS</span>
                        {Number(comm.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={comm.status === "PAID" ? "default" : comm.status === "APPROVED" ? "secondary" : "outline"}
                        className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            comm.status === "PAID" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none",
                            comm.status === "APPROVED" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none",
                            comm.status === "PENDING" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none"
                        )}
                      >
                        {comm.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                         {new Date(comm.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <AdminCommissionActions id={comm.id} status={comm.status} onSuccess={loadFinanceData} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 border-t border-slate-50 dark:border-slate-800">
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
    </div>
  );
}
