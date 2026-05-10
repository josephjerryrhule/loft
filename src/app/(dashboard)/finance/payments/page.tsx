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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Tracker</h1>
          <p className="text-muted-foreground mt-1">Log of all subscription payments across all plans and regions</p>
        </div>
        <Button onClick={() => exportToCSV(transactions)} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              GHS {(summary.totalRevenue ?? 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" /> This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              GHS {(summary.revenueThisMonth ?? 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              GHS {(summary.revenueThisWeek ?? 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Failed This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.failedThisMonth ?? 0}</div>
            <p className="text-xs text-muted-foreground">Transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by parent name or reference..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
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
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Gateway" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Gateways</SelectItem>
            <SelectItem value="PAYSTACK">Paystack</SelectItem>
            <SelectItem value="STRIPE">Stripe</SelectItem>
          </SelectContent>
        </Select>
        <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
          <SelectTrigger className="w-36">
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
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            {plans.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground self-center" />}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Child</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Gateway</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
              {transactions.map((tx: any) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-sm">{new Date(tx.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{tx.parentName}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{tx.childName}</TableCell>
                  <TableCell className="text-sm">{tx.plan}</TableCell>
                  <TableCell className="font-medium">
                    {tx.currency} {tx.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{tx.gateway}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[tx.paymentStatus] || "outline"}>
                      {tx.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.isRecurring ? "secondary" : "outline"} className="text-xs">
                      {tx.isRecurring ? "Recurring" : "New"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {tx.paymentReference ? tx.paymentReference.slice(0, 16) + "..." : "—"}
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
