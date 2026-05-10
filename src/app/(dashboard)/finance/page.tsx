"use client";

import { useEffect, useState, useCallback } from "react";
import { getAmbassadorTrackingData } from "@/app/actions/finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Download, Users, TrendingUp, Wallet, AlertCircle } from "lucide-react";
import { toast } from "sonner";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ambassador Tracking</h1>
          <p className="text-muted-foreground mt-1">Full view of all ambassadors, activity, and commission earnings</p>
        </div>
        <Button onClick={() => exportToCSV(rows)} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" /> Total Ambassadors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalAmbassadors ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Total Commissions Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              GHS {(summary.totalCommissionsEarned ?? 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Outstanding Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              GHS {(summary.totalOutstanding ?? 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Total Paid Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              GHS {(summary.totalPaidOut ?? 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="AFFILIATE">Affiliate</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={managerFilter} onValueChange={setManagerFilter}>
          <SelectTrigger className="w-48">
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
        {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground self-center" />}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ambassador</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Recruits</TableHead>
                <TableHead className="text-right">Revenue (GHS)</TableHead>
                <TableHead className="text-right">Commissions (GHS)</TableHead>
                <TableHead className="text-right">Outstanding (GHS)</TableHead>
                <TableHead className="text-right">Paid Out (GHS)</TableHead>
                <TableHead>Joined</TableHead>
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
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-muted-foreground">{row.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.role === "MANAGER" ? "default" : "secondary"}>
                      {row.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{row.manager}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === "ACTIVE" ? "default" : "destructive"}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{row.customersRecruited}</TableCell>
                  <TableCell className="text-right">{row.revenueGenerated.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-green-600 font-medium">
                    {row.totalCommissions.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-amber-600">
                    {row.outstandingPayouts.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-purple-600">
                    {row.paidOut.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(row.joinedAt).toLocaleDateString()}
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
