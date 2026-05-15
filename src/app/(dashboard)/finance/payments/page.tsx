"use client";

import { useEffect, useState, useCallback } from "react";
import { getPaymentTrackerData } from "@/app/actions/finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Download, DollarSign, TrendingUp, AlertTriangle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { PremiumKPICard } from "@/components/dashboard/PremiumKPICard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { cn } from "@/lib/utils";

function exportToCSV(rows: any[]) {
  const headers = [
    "Date", "Parent Name", "Child Name", "Plan", "Amount", "Currency",
    "Gateway", "Status", "Reference", "Recurring",
  ];
  const csvRows = rows.map((r) => [
    new Date(r.date).toLocaleDateString(), r.parentName, r.childName, r.plan,
    r.amount.toFixed(2), r.currency, r.gateway, r.paymentStatus,
    r.paymentReference || "", r.isRecurring ? "Yes" : "No",
  ]);
  const csv = [headers, ...csvRows].map((row) => row.map(String).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payment-tracker-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  COMPLETED: "default",
  PENDING: "secondary",
  FAILED: "destructive",
  CANCELLED: "outline",
};

export default function PaymentTrackerPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gatewayFilter, setGatewayFilter] = useState("all");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPaymentTrackerData({
        search: search || undefined,
        status: statusFilter,
        gateway: gatewayFilter,
        currency: currencyFilter,
        planId: planFilter,
      });
      setData(result);
    } catch {
      toast.error("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, gatewayFilter, currencyFilter, planFilter]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { transactions = [], plans = [], summary = {} } = data || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Payment Tracker"
        subtitle="Complete log of all subscription payments across all plans and regions"
        actions={
          <Button onClick={() => exportToCSV(transactions)} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PremiumKPICard
          title="Total Revenue"
          value={`GHS ${(summary.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          theme="success"
          trend={{ value: "All time", label: "Lifetime earnings", type: "up" }}
        />
        <PremiumKPICard
          title="This Month"
          value={`GHS ${(summary.revenueThisMonth ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={Calendar}
          theme="primary"
        />
        <PremiumKPICard
          title="This Week"
          value={`GHS ${(summary.revenueThisWeek ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          theme="info"
        />
        <PremiumKPICard
          title="Failed (Month)"
          value={summary.failedThisMonth ?? 0}
          icon={AlertTriangle}
          theme="warning"
          description="Transactions this month"
        />
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[240px]">
              <Input
                placeholder="Search by parent name or reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-slate-50 dark:bg-slate-800 border-none">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
                <SelectTrigger className="w-40 bg-slate-50 dark:bg-slate-800 border-none">
                  <SelectValue placeholder="Gateway" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Gateways</SelectItem>
                  <SelectItem value="PAYSTACK">Paystack</SelectItem>
                  <SelectItem value="STRIPE">Stripe</SelectItem>
                </SelectContent>
              </Select>
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger className="w-36 bg-slate-50 dark:bg-slate-800 border-none">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="GHS">GHS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="NGN">NGN</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-44 bg-slate-50 dark:bg-slate-800 border-none">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {plans.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-primary self-center" />}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-900">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Child</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Gateway</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-20 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <DollarSign className="h-10 w-10 opacity-20" />
                      <p>No transactions found matching your filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {transactions.map((tx: any) => (
                <TableRow key={tx.id} className="group transition-colors">
                  <TableCell className="text-sm font-medium text-slate-500">
                    {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{tx.parentName}</div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">{tx.childName || "—"}</TableCell>
                  <TableCell className="text-sm font-medium">{tx.plan}</TableCell>
                  <TableCell className="font-black text-slate-900 dark:text-white">
                    <span className="text-[10px] text-slate-400 mr-1">{tx.currency}</span>
                    {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-800 border-none">
                      {tx.gateway}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={STATUS_COLORS[tx.paymentStatus] || "outline"}
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        tx.paymentStatus === "COMPLETED" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none",
                        tx.paymentStatus === "FAILED" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none",
                        tx.paymentStatus === "PENDING" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none"
                      )}
                    >
                      {tx.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.isRecurring ? "secondary" : "outline"} className="text-[10px] font-bold border-none">
                      {tx.isRecurring ? "RECURRING" : "NEW"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[10px] text-slate-400 font-mono text-right">
                    {tx.paymentReference ? (
                      <span title={tx.paymentReference}>
                        {tx.paymentReference.slice(0, 8)}...{tx.paymentReference.slice(-4)}
                      </span>
                    ) : "—"}
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
