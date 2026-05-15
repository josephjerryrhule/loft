"use client";

import { useEffect, useState, useCallback } from "react";
import { getAmbassadorTrackingData } from "@/app/actions/finance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Download, Users, TrendingUp, Wallet, AlertCircle, Search, Filter } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAmbassadorTrackingData({
        search: search || undefined,
        role: roleFilter,
        status: statusFilter,
        managerId: managerFilter,
      });
      setData(result);
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="font-bold">Ambassador</TableHead>
                  <TableHead className="font-bold">Role</TableHead>
                  <TableHead className="font-bold">Manager</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">Recruits</TableHead>
                  <TableHead className="text-right font-bold">Revenue (GHS)</TableHead>
                  <TableHead className="text-right font-bold">Comm. (GHS)</TableHead>
                  <TableHead className="text-right font-bold text-amber-600">Owed (GHS)</TableHead>
                  <TableHead className="text-right font-bold text-emerald-600">Paid (GHS)</TableHead>
                  <TableHead className="font-bold">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      No ambassadors found.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row: any) => (
                  <TableRow key={row.id} className="group transition-colors">
                    <TableCell>
                      <div className="font-bold text-slate-900 dark:text-white">{row.name}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{row.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={row.role === "MANAGER" ? "bg-indigo-500/10 text-indigo-600 border-none" : "bg-slate-500/10 text-slate-600 border-none"}>
                        {row.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs font-medium">{row.manager || "-"}</TableCell>
                    <TableCell>
                      <Badge className={row.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600 border-none" : "bg-destructive/10 text-destructive border-none"}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-black">{row.customersRecruited}</TableCell>
                    <TableCell className="text-right font-medium">{row.revenueGenerated.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-slate-900 dark:text-white font-bold">
                      {row.totalCommissions.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-amber-600 font-black">
                      {row.outstandingPayouts.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600 font-black">
                      {row.paidOut.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium">
                      {new Date(row.joinedAt).toLocaleDateString()}
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

