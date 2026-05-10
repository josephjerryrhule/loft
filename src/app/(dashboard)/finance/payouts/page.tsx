"use client";

import { useEffect, useState, useCallback } from "react";
import { getFinancePayoutRequests, financeApprovePayout, financeMarkPayoutPaid, financeRejectPayout } from "@/app/actions/finance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle2, XCircle, Wallet, Clock, Download } from "lucide-react";
import { toast } from "sonner";

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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { requests = [], summary = {} } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payout Requests</h1>
          <p className="text-muted-foreground mt-1">Review and issue payouts to ambassadors and managers</p>
        </div>
        <Button onClick={() => exportToCSV(requests)} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" /> Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{summary.totalPending ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              GHS {(summary.amountPending ?? 0).toFixed(2)} outstanding
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.totalApproved ?? 0}</div>
            <p className="text-xs text-muted-foreground">Ready to pay</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Paid Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.totalPaid ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-slate-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Payout Requests</CardTitle>
          <CardDescription>Approve pending requests, then mark as paid once funds are disbursed</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ambassador</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Amount (GHS)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Processed</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No payout requests yet.
                  </TableCell>
                </TableRow>
              )}
              {requests.map((req: any) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <div className="font-medium text-sm">
                      {req.user.firstName || ""} {req.user.lastName || ""}
                    </div>
                    <div className="text-xs text-muted-foreground">{req.user.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{req.user.role}</Badge>
                  </TableCell>
                  <TableCell className="font-bold">
                    {Number(req.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        req.status === "PAID" ? "default"
                          : req.status === "APPROVED" ? "secondary"
                          : req.status === "REJECTED" ? "destructive"
                          : "outline"
                      }
                    >
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{new Date(req.requestedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {req.processedAt ? new Date(req.processedAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                    {req.adminNotes || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {req.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-1"
                          disabled={actionLoading === req.id}
                          onClick={() => setConfirmDialog({ id: req.id, action: "approve", name: req.user.email })}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </Button>
                      )}
                      {req.status === "APPROVED" && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 gap-1"
                          disabled={actionLoading === req.id}
                          onClick={() => setConfirmDialog({ id: req.id, action: "paid", name: req.user.email })}
                        >
                          <Wallet className="h-3.5 w-3.5" /> Mark Paid
                        </Button>
                      )}
                      {(req.status === "PENDING" || req.status === "APPROVED") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-50 hover:text-red-600 gap-1"
                          disabled={actionLoading === req.id}
                          onClick={() => setConfirmDialog({ id: req.id, action: "reject", name: req.user.email })}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                      )}
                      {req.status === "PAID" && (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => { setConfirmDialog(null); setNotes(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog?.action === "approve" && "Approve Payout Request"}
              {confirmDialog?.action === "paid" && "Mark as Paid"}
              {confirmDialog?.action === "reject" && "Reject Payout Request"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.action === "approve" && `Approve the payout request from ${confirmDialog?.name}?`}
              {confirmDialog?.action === "paid" && `Confirm payment has been disbursed to ${confirmDialog?.name}. This will also mark all their approved commissions as paid.`}
              {confirmDialog?.action === "reject" && `Reject the payout request from ${confirmDialog?.name}?`}
            </DialogDescription>
          </DialogHeader>
          {(confirmDialog?.action === "paid" || confirmDialog?.action === "reject") && (
            <Textarea
              placeholder="Add notes (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmDialog(null); setNotes(""); }}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={!!actionLoading}
              variant={confirmDialog?.action === "reject" ? "destructive" : "default"}
              className={confirmDialog?.action === "paid" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
