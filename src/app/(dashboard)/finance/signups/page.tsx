"use client";

import { useEffect, useState, useCallback } from "react";
import { getDailySignupData } from "@/app/actions/finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Download, Users, UserCheck, CalendarDays, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function exportToCSV(rows: any[]) {
  const headers = ["Date", "Parent Name", "Source", "Ambassador", "Plan", "Payment Status"];
  const csvRows = rows.map((r) => [
    new Date(r.date).toLocaleDateString(), r.parentName, r.source,
    r.ambassador, r.plan, r.paymentStatus,
  ]);
  const csv = [headers, ...csvRows].map((row) => row.map(String).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `daily-signups-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DailySignupsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [ambassadorFilter, setAmbassadorFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDailySignupData({
        source: sourceFilter === "all" ? undefined : sourceFilter,
        ambassadorId: ambassadorFilter === "all" ? undefined : ambassadorFilter,
      });
      setData(result);
    } catch {
      toast.error("Failed to load signup data");
    } finally {
      setLoading(false);
    }
  }, [sourceFilter, ambassadorFilter]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { rows = [], chartData = [], ambassadors = [], summary = {} } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Daily Signup Tracker</h1>
          <p className="text-muted-foreground mt-1">New user registrations and subscription activations by day</p>
        </div>
        <Button onClick={() => exportToCSV(rows)} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.totalToday ?? 0}</div>
            <p className="text-xs text-muted-foreground">New signups</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart2 className="h-4 w-4" /> This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{summary.totalThisWeek ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" /> This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{summary.totalThisMonth ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4" /> Ambassador-Attributed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.ambassadorPct ?? 0}%</div>
            <p className="text-xs text-muted-foreground">of signups this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Signups</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              No data in selected range
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })}
                  tick={{ fontSize: 12 }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(l) => new Date(l).toLocaleDateString()}
                  formatter={(val, name) => [val, name === "referred" ? "Ambassador" : name === "organic" ? "Organic" : "Total"]}
                />
                <Legend formatter={(v) => v === "referred" ? "Ambassador" : v === "organic" ? "Organic" : "Total"} />
                <Bar dataKey="organic" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                <Bar dataKey="referred" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="organic">Organic</SelectItem>
            <SelectItem value="referred">Ambassador Referred</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ambassadorFilter} onValueChange={setAmbassadorFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Ambassador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ambassadors</SelectItem>
            {ambassadors.map((a: any) => (
              <SelectItem key={a.id} value={a.id}>
                {a.firstName || ""} {a.lastName || ""} {!a.firstName && !a.lastName ? a.email : ""}
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
                <TableHead>Date</TableHead>
                <TableHead>Parent Name</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Ambassador</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Payment Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No signup data found.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row: any) => (
                <TableRow key={row.id}>
                  <TableCell className="text-sm">{new Date(row.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{row.parentName}</TableCell>
                  <TableCell>
                    <Badge variant={row.source === "Referred" ? "default" : "outline"}>
                      {row.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.ambassador}</TableCell>
                  <TableCell className="text-sm">{row.plan}</TableCell>
                  <TableCell>
                    <Badge variant={row.paymentStatus === "COMPLETED" ? "default" : row.paymentStatus === "FAILED" ? "destructive" : "secondary"}>
                      {row.paymentStatus}
                    </Badge>
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
