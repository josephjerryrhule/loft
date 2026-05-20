"use client";

import { useEffect, useState, useCallback } from "react";
import { getDailySignupData } from "@/app/actions/finance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Download, Users, UserCheck, CalendarDays, BarChart2, Filter, Search, Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PremiumKPICard } from "@/components/dashboard/PremiumKPICard";
import { cn, formatStatusLabel } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
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
        <Loader2 className="h-8 w-8 animate-spin text-[#E87154]" />
      </div>
    );
  }

  const { rows = [], chartData = [], ambassadors = [], summary = {} } = data || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Recent Signups"
        subtitle="Signup Overview"
        actions={
          <Button 
            onClick={() => exportToCSV(rows)} 
            variant="outline" 
            className="h-12 px-8 rounded-2xl font-black border-2 border-slate-100 dark:border-slate-800 hover:bg-slate-50 transition-all active:scale-95 gap-3"
          >
            <Download className="h-5 w-5" /> Export Analytics
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PremiumKPICard
          title="New Growth"
          value={summary.totalToday ?? 0}
          description="Signups recorded today"
          icon={CalendarDays}
          theme="primary"
          trend={{ value: "Live", label: "Real-time", type: "up" }}
        />
        <PremiumKPICard
          title="Weekly Volume"
          value={summary.totalThisWeek ?? 0}
          description="Last 7 rolling days"
          icon={TrendingUp}
          theme="info"
        />
        <PremiumKPICard
          title="Monthly Total"
          value={summary.totalThisMonth ?? 0}
          description="Current calendar month"
          icon={Users}
        />
        <PremiumKPICard
          title="Ambassador Impact"
          value={`${summary.ambassadorPct ?? 0}%`}
          description="Attributed acquisition"
          icon={UserCheck}
          theme="success"
          trend={{ value: "Performance", label: "High impact", type: "up" }}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-1">
        {/* Chart Card */}
        <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem]">
            <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-3 mb-1">
                    <div className="h-6 w-6 rounded-lg bg-[#E87154]/20 flex items-center justify-center">
                        <BarChart2 size={12} className="text-[#E87154]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 font-sans">Acquisition Timeline</span>
                </div>
                <CardTitle className="text-xl font-black">Daily Volume Analysis</CardTitle>
                <CardDescription>Visualizing organic vs attributed growth patterns over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
                {chartData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                        <BarChart2 className="h-12 w-12 opacity-10" />
                        <p className="font-bold tracking-wide text-sm">Insufficient data for visualization</p>
                    </div>
                ) : (
                    <div className="h-[320px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(v) => new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis 
                                    allowDecimals={false} 
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ 
                                        borderRadius: '16px', 
                                        border: 'none', 
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                        padding: '12px'
                                    }}
                                    labelStyle={{ fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}
                                />
                                <Legend 
                                    verticalAlign="top" 
                                    align="right" 
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                />
                                <Bar dataKey="organic" name="Organic" stackId="a" fill="#0f172a" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="referred" name="Attributed" stackId="a" fill="#E87154" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Filters Card */}
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[1.5rem]">
            <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Select value={sourceFilter} onValueChange={setSourceFilter}>
                                <SelectTrigger className="pl-11 h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus:ring-[#E87154] shadow-inner w-full">
                                    <SelectValue placeholder="Source Strategy" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                                    <SelectItem value="all" className="font-bold py-3 rounded-xl">All Channels</SelectItem>
                                    <SelectItem value="organic" className="font-bold py-3 rounded-xl">Organic Discovery</SelectItem>
                                    <SelectItem value="referred" className="font-bold py-3 rounded-xl text-[#E87154]">Ambassador Network</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="relative">
                            <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Select value={ambassadorFilter} onValueChange={setFilterValue => setAmbassadorFilter(setFilterValue)}>
                                <SelectTrigger className="pl-11 h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus:ring-[#E87154] shadow-inner w-full">
                                    <SelectValue placeholder="Specific Ambassador" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl p-2 max-h-[300px]">
                                    <SelectItem value="all" className="font-bold py-3 rounded-xl">All Contributors</SelectItem>
                                    {ambassadors.map((a: any) => (
                                        <SelectItem key={a.id} value={a.id} className="font-bold py-3 rounded-xl">
                                            {a.firstName || ""} {a.lastName || ""} {!a.firstName && !a.lastName ? a.email : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {loading && (
                        <div className="flex items-center gap-3 px-6 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl animate-pulse">
                            <Loader2 className="h-4 w-4 animate-spin text-[#E87154]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Updating...</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>

        {/* Table Card */}
        <div className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white dark:bg-slate-900">
            <div className="overflow-x-auto relative w-full">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="pl-10">Timestamp</TableHead>
                            <TableHead>Account Identity</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Attribution</TableHead>
                            <TableHead>Access Tier</TableHead>
                            <TableHead className="text-right pr-10">Verification</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-24 text-slate-400">
                                    <div className="flex flex-col items-center gap-3">
                                        <Search className="h-12 w-12 opacity-10" />
                                        <p className="font-bold tracking-wide">No signup logs found matching current parameters.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row: any) => (
                                <TableRow key={row.id} className="group transition-all duration-300">
                                    <TableCell className="pl-10 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900 dark:text-white tracking-tighter text-base group-hover:text-[#E87154] transition-colors whitespace-nowrap">
                                                {new Date(row.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap mt-0.5">
                                                {new Date(row.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center font-black text-slate-400 text-xs">
                                                {row.parentName ? row.parentName.substring(0, 2).toUpperCase() : "?"}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-black text-sm text-slate-900 dark:text-white truncate max-w-[180px] tracking-tight">{row.parentName || "Anonymous User"}</span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Parent Account</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant="outline"
                                            className={cn(
                                                "text-[9px] font-black uppercase tracking-[0.2em] border-none px-3 h-6",
                                                row.source === "Referred" ? "bg-[#E87154]/10 text-[#E87154]" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                                            )}
                                        >
                                            {row.source}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                        {row.ambassador || "Direct/Organic"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-[#E87154]" />
                                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">{row.plan}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-10">
                                        <Badge 
                                            className={cn(
                                                "text-[10px] font-black uppercase tracking-widest border-none px-4 h-7 shadow-sm",
                                                row.paymentStatus === "COMPLETED" ? "bg-emerald-500 text-white" : 
                                                row.paymentStatus === "FAILED" ? "bg-red-500 text-white" : 
                                                "bg-slate-700 text-white"
                                            )}
                                        >
                                             {row.paymentStatus === "COMPLETED" ? <CheckCircle2 size={10} className="mr-1.5" /> : null}
                                             {formatStatusLabel(row.paymentStatus)}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="p-6 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">End of List</span>
            </div>
        </div>
      </div>
    </div>
  );
}
