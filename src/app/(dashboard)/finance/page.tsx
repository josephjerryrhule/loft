"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getAmbassadorTrackingData } from "@/app/actions/finance";
import { getManualPayments } from "@/app/actions/manual-payment";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Download, Users, TrendingUp, Wallet, AlertCircle, Search, Filter, HandCoins } from "lucide-react";
import { toast } from "sonner";
import { PremiumKPICard } from "@/components/dashboard/PremiumKPICard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DashboardTable } from "@/components/dashboard/DashboardTable";

function exportToCSV(rows: any[]) {
  const headers = [
    "Name", "Email", "Role", "Manager", "Status",
    "Customers Recruited", "Revenue Generated (GHS)", "Total Commissions (GHS)",
    "Outstanding Payouts (GHS)", "Paid Out (GHS)", "Joined",
  ];
  const csvRows = rows.map((r) => [
    r.name, r.email, r.role, r.manager, r.status,
    r.customersRecruited, r.revenueGenerated.toFixed(2), r.totalCommissions.toFixed(2),
    r.outstandingPayouts.toFixed(2), r.paidOut.toFixed(2),
    new Date(r.joinedAt).toLocaleDateString(),
  ]);
  const csv = [headers, ...csvRows].map((row) => row.map(String).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ambassador-tracking-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AmbassadorTrackingPage() {
  const [data, setData] = useState<any>(null);
  const [manualSummary, setManualSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [result, manualResult] = await Promise.all([
        getAmbassadorTrackingData({
          search: search || undefined,
          role: roleFilter,
          status: statusFilter,
          managerId: managerFilter,
        }),
        getManualPayments()
      ]);
      setData(result);
      setManualSummary(manualResult?.summary || null);
    } catch (e) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, managerFilter]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { rows = [], summary = {}, managers = [] } = data || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Ambassador Tracking"
        subtitle="Full view of all ambassadors, activity, and commission earnings"
        actions={
          <Button onClick={() => exportToCSV(rows)} variant="outline" className="gap-2 shadow-sm">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <PremiumKPICard
          title="Total Ambassadors"
          value={summary.totalAmbassadors ?? 0}
          icon={Users}
          theme="info"
        />
        <PremiumKPICard
          title="Total Commissions"
          value={`GHS ${(summary.totalCommissionsEarned ?? 0).toFixed(2)}`}
          icon={TrendingUp}
          theme="success"
        />
        <PremiumKPICard
          title="Outstanding Payouts"
          value={`GHS ${(summary.totalOutstanding ?? 0).toFixed(2)}`}
          icon={AlertCircle}
          theme="warning"
        />
        <PremiumKPICard
          title="Total Paid Out"
          value={`GHS ${(summary.totalPaidOut ?? 0).toFixed(2)}`}
          icon={Wallet}
        />
        <Link href="/finance/manual-payments" className="block transition-transform hover:scale-[1.02]">
          <PremiumKPICard
            title="Manual Payments"
            value={`GHS ${(manualSummary?.totalAmount ?? 0).toFixed(2)}`}
            icon={HandCoins}
            theme="primary"
            description={`${manualSummary?.totalCount ?? 0} manual transactions`}
          />
        </Link>
      </div>

      <div className="space-y-4">
          {/* Filters Bar */}
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-visible">
            <CardContent className="p-4 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-slate-50 dark:bg-slate-800 border-none h-10"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400 mr-1" />
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-36 h-10 bg-slate-50 dark:bg-slate-800 border-none">
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="AFFILIATE">Affiliate</SelectItem>
                            <SelectItem value="MANAGER">Manager</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-36 h-10 bg-slate-50 dark:bg-slate-800 border-none">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={managerFilter} onValueChange={setManagerFilter}>
                        <SelectTrigger className="w-48 h-10 bg-slate-50 dark:bg-slate-800 border-none">
                            <SelectValue placeholder="Manager" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Managers</SelectItem>
                            {managers.map((m: any) => (
                                <SelectItem key={m.id} value={m.id}>
                                    {m.firstName || ""} {m.lastName || ""} {!m.firstName && !m.lastName ? m.email : ""}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {loading && <Loader2 className="h-5 w-5 animate-spin text-[#E87154] ml-auto" />}
            </CardContent>
          </Card>

          {/* Data Table */}
          <DashboardTable
            title="Ambassador Network"
            description="Detailed performance metrics for every ambassador"
            icon={<Users size={18} />}
          >
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="pl-6">Ambassador</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Recruits</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Comm.</TableHead>
                  <TableHead className="text-right">Owed</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right pr-6">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-20 text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-10 w-10 opacity-20" />
                        <p>No ambassadors found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row: any) => (
                  <TableRow key={row.id} className="group transition-colors">
                    <TableCell className="pl-6">
                      <Link href={`/admin/users/${row.id}`} className="font-bold text-sm text-slate-900 dark:text-white hover:text-[#E87154] transition-colors">
                        {row.name}
                      </Link>
                      <div className="text-[10px] text-slate-500 font-medium">{row.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-bold uppercase tracking-wider border-none",
                        row.role === "MANAGER" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30" : "bg-slate-50 text-slate-600 dark:bg-slate-800"
                      )}>
                        {row.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-[11px] font-medium">
                      {row.managerId ? (
                        <Link href={`/admin/users/${row.managerId}`} className="hover:text-[#E87154] transition-colors font-bold">
                          {row.manager}
                        </Link>
                      ) : (
                        row.manager || "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={row.status === "ACTIVE" ? "default" : "secondary"}
                        className={cn(
                            "text-[10px] font-bold uppercase tracking-wider border-none",
                            row.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-6 rounded-full bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white text-[10px]">
                            {row.customersRecruited}
                        </span>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                        <span className="text-[10px] text-slate-400 mr-1">GHS</span>
                        {row.revenueGenerated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold text-slate-900 dark:text-white">
                        <span className="text-[10px] text-slate-400 mr-1">GHS</span>
                        {row.totalCommissions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-sm font-black text-amber-600">
                        <span className="text-[10px] opacity-70 mr-1">GHS</span>
                        {row.outstandingPayouts.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-sm font-black text-emerald-600">
                        <span className="text-[10px] opacity-70 mr-1">GHS</span>
                        {row.paidOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right pr-6 text-xs text-slate-500 font-medium">
                      {new Date(row.joinedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DashboardTable>
      </div>
    </div>
  );
}

