"use client";

import { useEffect, useState, useCallback } from "react";
import { getFinancePayoutRequests, financeApprovePayout, financeMarkPayoutPaid, financeRejectPayout } from "@/app/actions/finance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle2, XCircle, Wallet, Clock, Download, ArrowUpRight, Search, ShieldCheck, DollarSign, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PremiumKPICard } from "@/components/dashboard/PremiumKPICard";
import { cn } from "@/lib/utils";

function exportToCSV(requests: any[]) {
  const headers = ["Ambassador", "Role", "Amount (GHS)", "Status", "Requested", "Processed", "Notes"];
  const csvRows = requests.map((r) => [
    r.user.email,
    r.user.role,
    Number(r.amount).toFixed(2),
    r.status,
    new Date(r.requestedAt).toLocaleDateString(),
    r.processedAt ? new Date(r.processedAt).toLocaleDateString() : "",
    r.adminNotes || "",
  ]);
  const csv = [headers, ...csvRows].map((row) => row.map(String).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payout-requests-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type PayoutAction = "approve" | "paid" | "reject" | null;

export default function PayoutRequestsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ id: string; action: PayoutAction; name: string } | null>(null);
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getFinancePayoutRequests();
      setData(result);
    } catch {
      toast.error("Failed to load payout requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async () => {
    if (!confirmDialog) return;
    setActionLoading(confirmDialog.id);
    try {
      let result;
      if (confirmDialog.action === "approve") {
        result = await financeApprovePayout(confirmDialog.id);
      } else if (confirmDialog.action === "paid") {
        result = await financeMarkPayoutPaid(confirmDialog.id, notes || undefined);
      } else if (confirmDialog.action === "reject") {
        result = await financeRejectPayout(confirmDialog.id, notes || undefined);
      }
      if (result && "error" in result) {
        toast.error(result.error);
      } else {
        const messages = { approve: "Approved!", paid: "Marked as paid!", reject: "Rejected" };
        toast.success(messages[confirmDialog.action!] || "Done");
        setConfirmDialog(null);
        setNotes("");
        await load();
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#E87154]" />
      </div>
    );
  }

  const { requests = [], summary = {} } = data || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Payout Requests"
        subtitle="Review, authorize, and verify commission disbursements for the ambassador network"
        actions={
          <Button 
            onClick={() => exportToCSV(requests)} 
            variant="outline" 
            className="h-12 px-8 rounded-2xl font-black border-2 border-slate-100 dark:border-slate-800 hover:bg-slate-50 transition-all active:scale-95 gap-3"
          >
            <Download className="h-5 w-5" /> Export Requests
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <PremiumKPICard
          title="Pending Queue"
          value={summary.totalPending ?? 0}
          description={`GHS ${(summary.amountPending ?? 0).toLocaleString()} total`}
          icon={Clock}
          theme="warning"
          trend={{ value: "Review", label: "Required", type: "neutral" }}
        />
        <PremiumKPICard
          title="Approved (Ready)"
          value={summary.totalApproved ?? 0}
          description="Awaiting disbursement"
          icon={ShieldCheck}
          theme="info"
        />
        <PremiumKPICard
          title="Settled (Paid)"
          value={summary.totalPaid ?? 0}
          description="Successfully disbursed"
          icon={CheckCircle2}
          theme="success"
          trend={{ value: "Finalized", label: "Complete", type: "up" }}
        />
        <PremiumKPICard
          title="Total Lifetime"
          value={requests.length}
          description="Aggregated requests"
          icon={Wallet}
        />
      </div>

      {/* Table Card */}
      <div className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white dark:bg-slate-900">
        <div className="p-8 pb-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <div>
                <CardTitle className="text-xl font-black">Payment History</CardTitle>
                <CardDescription>Comprehensive history of all withdrawal requests and settlements</CardDescription>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Search size={18} />
            </div>
        </div>
        <div className="overflow-x-auto relative w-full">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="pl-10">Ambassador</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Requested Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Admin Notes</TableHead>
                <TableHead className="text-right pr-10">Control</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-24 text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                        <Wallet className="h-12 w-12 opacity-10" />
                        <p className="font-bold tracking-wide">The payout queue is currently empty.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req: any) => (
                  <TableRow key={req.id} className="group transition-all duration-300">
                    <TableCell className="pl-10 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 dark:text-white tracking-tight group-hover:text-[#E87154] transition-colors">{req.user.firstName || ""} {req.user.lastName || "Staff Account"}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{req.user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] bg-slate-50 dark:bg-slate-800 border-none px-3 h-6">
                        {req.user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-base font-black text-slate-900 dark:text-white leading-none whitespace-nowrap">
                            <span className="text-[10px] text-slate-400 mr-1 font-bold uppercase">GHS</span>
                            {Number(req.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                            "text-[10px] font-black uppercase tracking-widest border-none px-3 h-7 shadow-sm",
                            req.status === "PAID" && "bg-emerald-500 text-white",
                            req.status === "APPROVED" && "bg-blue-500 text-white",
                            req.status === "REJECTED" && "bg-red-500 text-white",
                            req.status === "PENDING" && "bg-amber-500 text-white"
                        )}
                      >
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">{new Date(req.requestedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            {req.processedAt && <span className="text-[10px] text-emerald-500 font-black uppercase tracking-tighter mt-0.5">Settled {new Date(req.processedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
                        </div>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-[11px] font-medium text-slate-400 italic">
                      {req.adminNotes || "No remarks"}
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <div className="flex items-center justify-end gap-2">
                        {req.status === "PENDING" && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 h-9 rounded-xl font-black text-[10px] uppercase tracking-widest px-4 shadow-lg shadow-blue-500/20"
                            disabled={actionLoading === req.id}
                            onClick={() => setConfirmDialog({ id: req.id, action: "approve", name: req.user.email })}
                          >
                            Authorize
                          </Button>
                        )}
                        {req.status === "APPROVED" && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 h-9 rounded-xl font-black text-[10px] uppercase tracking-widest px-4 shadow-lg shadow-emerald-500/20"
                            disabled={actionLoading === req.id}
                            onClick={() => setConfirmDialog({ id: req.id, action: "paid", name: req.user.email })}
                          >
                            Mark Paid
                          </Button>
                        )}
                        {(req.status === "PENDING" || req.status === "APPROVED") && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all"
                            disabled={actionLoading === req.id}
                            onClick={() => setConfirmDialog({ id: req.id, action: "reject", name: req.user.email })}
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                        {req.status === "PAID" && (
                          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900/20 shadow-sm">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Finalized</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-6 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Verified</span>
        </div>
      </div>

      <Dialog open={!!confirmDialog} onOpenChange={() => { setConfirmDialog(null); setNotes(""); }}>
        <DialogContent className="sm:max-w-[32rem] border-none shadow-2xl p-0 rounded-[2rem] overflow-y-auto max-h-[95vh] bg-white">
            <div className={cn(
                "p-8 relative border-b border-stone-100",
                confirmDialog?.action === "reject" ? "bg-red-50 text-red-900" : "bg-[#FFFAF5] text-slate-900"
            )}>
                <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12">
                    {confirmDialog?.action === "paid" ? <Wallet size={100} className="text-stone-900" /> : <ShieldCheck size={100} className={confirmDialog?.action === "reject" ? "text-red-900" : "text-stone-900"} />}
                </div>
                <DialogHeader className="relative z-10">
                    <DialogTitle className="text-2xl font-black leading-none">
                        {confirmDialog?.action === "approve" && "Authorize Payout"}
                        {confirmDialog?.action === "paid" && "Disbursement Finalization"}
                        {confirmDialog?.action === "reject" && "Nullify Request"}
                    </DialogTitle>
                    <DialogDescription className="font-medium mt-3 text-sm italic text-stone-500">
                        {confirmDialog?.action === "approve" && `Verification for ${confirmDialog?.name}`}
                        {confirmDialog?.action === "paid" && `Disbursing funds to ${confirmDialog?.name}`}
                        {confirmDialog?.action === "reject" && `Archiving request from ${confirmDialog?.name}`}
                    </DialogDescription>
                </DialogHeader>
            </div>
            
            <div className="p-8 space-y-6 bg-white dark:bg-slate-900">
                {(confirmDialog?.action === "paid" || confirmDialog?.action === "reject") && (
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Administrative Remarks</Label>
                        <Textarea
                            placeholder="Add internal notes regarding this disbursement..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="min-h-[100px] bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-medium focus-visible:ring-[#E87154] shadow-inner p-4"
                        />
                    </div>
                )}
                
                {confirmDialog?.action === "paid" && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20 text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                        NOTICE: This action confirms that funds have been moved via external gateway. Approved commissions for this user will be marked as settled.
                    </div>
                )}

                <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button variant="ghost" className="flex-1 h-12 rounded-xl text-slate-400 font-bold hover:text-slate-900 hover:bg-slate-100 transition-all" onClick={() => { setConfirmDialog(null); setNotes(""); }}>
                        Discard
                    </Button>
                    <Button
                        onClick={handleAction}
                        disabled={!!actionLoading}
                        className={cn(
                            "flex-[2] h-12 rounded-xl font-black shadow-lg transition-all active:scale-95 text-white",
                            confirmDialog?.action === "reject" ? "bg-red-600 hover:bg-red-700 shadow-red-600/20" : 
                            confirmDialog?.action === "paid" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : 
                            "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                        )}
                    >
                        {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Commit Action"}
                    </Button>
                </DialogFooter>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
