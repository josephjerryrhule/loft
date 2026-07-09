"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, CreditCard, FileText, Search, Eye, Clock, CheckCircle2,
  XCircle, UserCheck, Mic, Star, Award, Download, Filter,
  ChevronLeft, ChevronRight, BarChart3, TrendingUp, Percent,
  CalendarCheck, Loader2, RefreshCw, MessageSquare, Paperclip, MoreHorizontal,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getRecruitmentDashboardStats,
  getRecruitmentApplicants,
  getRecruitmentAnalytics,
  exportApplicants,
  getAuditionEvents,
  syncAllApplicantsToSheets,
} from "@/app/actions/recruitment";
import { RECRUITMENT_STATUSES } from "@/lib/recruitment-constants";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-700" },
  PENDING_PAYMENT: { label: "Pending Payment", className: "bg-amber-50 text-amber-700" },
  APPLICATION_SUBMITTED: { label: "Submitted", className: "bg-blue-50 text-blue-700" },
  UNDER_REVIEW: { label: "Under Review", className: "bg-sky-50 text-sky-700" },
  AUDITION_INVITED: { label: "Audition Invited", className: "bg-violet-50 text-violet-700" },
  AUDITION_CONFIRMED: { label: "Audition Confirmed", className: "bg-purple-50 text-purple-700" },
  AUDITION_ATTENDED: { label: "Audition Attended", className: "bg-indigo-50 text-indigo-700" },
  SHORTLISTED: { label: "Shortlisted", className: "bg-emerald-50 text-emerald-700" },
  SELECTED: { label: "Selected", className: "bg-green-50 text-green-700" },
  REJECTED: { label: "Rejected", className: "bg-red-50 text-red-700" },
  HIRED: { label: "Hired", className: "bg-emerald-100 text-emerald-800 font-bold" },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, className: "bg-slate-100 text-slate-600" };
  return <Badge variant="secondary" className={`${config.className} border-none font-semibold hover:bg-opacity-80`}>{config.label}</Badge>;
}

// Dummy data for sparklines
const sparklineData1 = [{v: 40}, {v: 30}, {v: 60}, {v: 50}, {v: 90}, {v: 80}, {v: 120}, {v: 110}, {v: 158}];
const sparklineData2 = [{v: 60}, {v: 65}, {v: 70}, {v: 68}, {v: 80}, {v: 75}, {v: 85}, {v: 82}, {v: 89}];

export default function RecruitmentDashboardPage() {
  const router = useRouter();

  // State
  const [stats, setStats] = useState<Record<string, number>>({});
  const [applicants, setApplicants] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Data Loading
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, applicantsRes, analyticsRes, eventsRes] = await Promise.all([
        getRecruitmentDashboardStats(),
        getRecruitmentApplicants({ search: search || undefined, status: statusFilter || undefined, paymentStatus: paymentFilter || undefined, page, pageSize: 20 }),
        getRecruitmentAnalytics(),
        getAuditionEvents()
      ]);
      if (statsRes.stats) setStats(statsRes.stats);
      if (applicantsRes.applicants) {
        setApplicants(applicantsRes.applicants);
        setTotalPages(applicantsRes.totalPages!);
        setTotal(applicantsRes.total!);
      }
      if (analyticsRes.analytics) setAnalytics(analyticsRes.analytics);
      if (eventsRes.events) setEvents(eventsRes.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  }, [search, statusFilter, paymentFilter, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Export
  const handleExport = async () => {
    const result = await exportApplicants({ status: statusFilter || undefined, paymentStatus: paymentFilter || undefined });
    if (result.error || !result.csv) return;
    const blob = new Blob([result.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recruitment-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [syncing, setSyncing] = useState(false);

  const handleSyncToSheets = async () => {
    if (!confirm("Are you sure you want to sync all applicants to Google Sheets? This will update or add all entries in real-time.")) {
      return;
    }
    setSyncing(true);
    try {
      const res = await syncAllApplicantsToSheets();
      if ("error" in res && res.error) {
        toast.error(`Sync failed: ${res.error}`);
      } else if ("successCount" in res) {
        toast.success(`Successfully synced ${res.successCount} applicants to Google Sheets (${res.failCount} failed).`);
      }
    } catch (err: any) {
      toast.error(`Sync error: ${err.message || "An unexpected error occurred."}`);
    } finally {
      setSyncing(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === applicants.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(applicants.map((a) => a.applicantId)));
  };

  // Avatar helper
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const funnelData = analytics ? [
    { name: "Total", value: analytics.totalApplicants, fill: "#94a3b8" },
    { name: "Paid", value: analytics.paidApplicants, fill: "#3b82f6" },
    { name: "Audition Invited", value: analytics.auditionInvited, fill: "#a855f7" },
    { name: "Attended", value: analytics.auditionAttended, fill: "#6366f1" },
    { name: "Shortlisted", value: analytics.shortlisted, fill: "#10b981" },
    { name: "Selected", value: analytics.selected, fill: "#22c55e" },
    { name: "Hired", value: analytics.hired, fill: "#059669" },
  ] : [];

  const statusDistribution = analytics ? [
    { name: "Pending Payment", value: analytics.pendingPayment, fill: "#f59e0b" },
    { name: "Submitted", value: analytics.submitted, fill: "#3b82f6" },
    { name: "Under Review", value: analytics.underReview, fill: "#0ea5e9" },
    { name: "Audition Invited", value: analytics.auditionInvited, fill: "#8b5cf6" },
    { name: "Attended", value: analytics.auditionAttended, fill: "#6366f1" },
    { name: "Shortlisted", value: analytics.shortlisted, fill: "#10b981" },
    { name: "Selected", value: analytics.selected, fill: "#22c55e" },
    { name: "Hired", value: analytics.hired, fill: "#059669" },
    { name: "Rejected", value: analytics.rejected, fill: "#ef4444" },
  ].filter(d => d.value > 0) : [];

  if (loading && !applicants.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-purple-600" />
          <p className="text-sm text-slate-500 font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  // Find recent action-needed applicants (for My Day)
  const actionNeeded = applicants.filter(a => ["APPLICATION_SUBMITTED", "UNDER_REVIEW", "PENDING_PAYMENT"].includes(a.status)).slice(0, 5);
  // Pending review avatars
  const pendingReviewers = applicants.filter(a => a.status === "APPLICATION_SUBMITTED").slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => loadData()}><RefreshCw size={14} className="mr-2"/> Refresh</Button>
          <Link href="/admin/recruitment/auditions">
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white"><CalendarCheck size={14} className="mr-2"/> Manage Auditions</Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-transparent border-b border-slate-200 w-full justify-start rounded-none h-auto p-0 space-x-8 mb-8">
          <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:shadow-none rounded-none px-0 pb-3 text-slate-500 font-medium">Overview</TabsTrigger>
          <TabsTrigger value="pipeline" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:shadow-none rounded-none px-0 pb-3 text-slate-500 font-medium">Pipeline</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:shadow-none rounded-none px-0 pb-3 text-slate-500 font-medium">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-0">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Metric 1 */}
            <Card className="border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-medium text-slate-500">Total Applicants</p>
                <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50 font-bold border-none">+12.4%</Badge>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-5xl font-normal tracking-tighter text-slate-900">{stats.total || 0}</p>
                <div className="h-12 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sparklineData1}>
                      <Bar dataKey="v" fill="#a855f7" radius={[2,2,0,0]} barSize={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>

            {/* Metric 2 */}
            <Card className="border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-medium text-slate-500">Completion rate</p>
                <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50 font-bold border-none">+6.5%</Badge>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-5xl font-normal tracking-tighter text-slate-900">{analytics?.paymentConversionRate || 0}%</p>
                <div className="h-12 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklineData2}>
                      <Line type="monotone" dataKey="v" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>

            {/* Metric 3 */}
            <Card className="border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-medium text-slate-500">Pending reviews</p>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-5xl font-normal tracking-tighter text-slate-900">{stats.APPLICATION_SUBMITTED || 0}</p>
                <div className="flex -space-x-3">
                  {pendingReviewers.map((app, i) => (
                    <div key={app.id} className="w-10 h-10 rounded-full border-2 border-white bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shadow-sm z-10" style={{ zIndex: 10 - i }}>
                      {getInitials(app.fullName)}
                    </div>
                  ))}
                  {(stats.APPLICATION_SUBMITTED || 0) > 3 && (
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shadow-sm z-0">
                      +{stats.APPLICATION_SUBMITTED - 3}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Main 2-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col: My Day */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-slate-900">My day</h2>
                <Button variant="outline" size="sm" className="rounded-full text-xs font-medium border-slate-200">View all</Button>
              </div>

              {actionNeeded.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-slate-100 rounded-2xl bg-white shadow-sm">
                  <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-3" />
                  <p>You're all caught up!</p>
                </div>
              ) : (
                actionNeeded.map((app) => (
                  <Card key={app.id} className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer rounded-2xl" onClick={() => router.push(`/admin/recruitment/${app.applicantId}`)}>
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center text-xs text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5 mr-1.5" />
                          Applied {formatDistanceToNow(new Date(app.createdAt))} ago
                        </div>
                        <div className="flex items-center gap-3 text-slate-400">
                          <span className="flex items-center text-xs"><MessageSquare className="w-3.5 h-3.5 mr-1" /> 0</span>
                          <span className="flex items-center text-xs"><Paperclip className="w-3.5 h-3.5 mr-1" /> 1</span>
                        </div>
                      </div>
                      
                      <h3 className="text-base font-semibold text-slate-900 mb-4">
                        Review application for {app.fullName}
                      </h3>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="bg-red-50 text-red-600 border-none font-medium text-[11px] hover:bg-red-50">High</Badge>
                          <StatusBadge status={app.status} />
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-medium text-[11px] hover:bg-slate-100">Reading Club</Badge>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-[10px]">
                          {getInitials(app.fullName)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Right Col */}
            <div className="space-y-6">
              {/* Team Capacity / Upcoming Auditions */}
              <Card className="border border-slate-100 shadow-sm rounded-2xl">
                <CardHeader className="pb-3 pt-5 px-6">
                  <CardTitle className="text-sm font-bold text-slate-900">Upcoming Auditions</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-0 space-y-4">
                  {events.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No upcoming events.</p>
                  ) : (
                    events.slice(0, 4).map(event => (
                      <div key={event.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs relative">
                            <CalendarCheck size={16} />
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{event.name}</p>
                            <p className="text-[11px] text-slate-500">{new Date(event.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border border-slate-100 shadow-sm rounded-2xl">
                <CardHeader className="pb-3 pt-5 px-6 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-900">Recent Applications</CardTitle>
                  <Button variant="ghost" size="icon" className="h-6 w-6"><RefreshCw size={12} /></Button>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-0 space-y-4">
                  {applicants.slice(0, 3).map((app) => (
                    <div key={app.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {getInitials(app.fullName)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900">{app.fullName}</p>
                        <p className="text-xs text-slate-500 leading-snug">Applied from {app.townCity}, {app.region}. Status is currently <span className="font-semibold text-purple-600">{app.status.replace(/_/g, ' ')}</span>.</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="mt-0">
          <Card className="border border-slate-100 shadow-sm rounded-2xl bg-white">
            <CardHeader className="pb-4 pt-6 px-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold">Applicant Pipeline</CardTitle>
                  <CardDescription>{total} applicant{total !== 1 ? "s" : ""} found</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input placeholder="Search name, ID…" className="pl-9 h-9 w-[220px] rounded-lg bg-slate-50 border-slate-200" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                  </div>
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "ALL" ? "" : v); setPage(1); }}>
                    <SelectTrigger className="h-9 w-[150px] rounded-lg bg-slate-50 border-slate-200">
                      <div className="flex items-center gap-2"><Filter size={12} /><SelectValue placeholder="All Statuses" /></div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      {RECRUITMENT_STATUSES.map((s) => (<SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={handleSyncToSheets} className="gap-2 h-9 rounded-lg" disabled={syncing}>
                    <Share2 size={14} /> {syncing ? "Syncing..." : "Sync Sheets"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 h-9 rounded-lg"><Download size={14} /> Export</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="relative overflow-x-auto">
                {tableLoading && (
                  <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-purple-600" />
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="w-10 px-6"><input type="checkbox" checked={applicants.length > 0 && selectedIds.size === applicants.length} onChange={toggleSelectAll} className="rounded border-slate-300" /></TableHead>
                      <TableHead className="font-semibold text-slate-600">Applicant</TableHead>
                      <TableHead className="font-semibold text-slate-600">Location</TableHead>
                      <TableHead className="font-semibold text-slate-600">Status</TableHead>
                      <TableHead className="font-semibold text-slate-600">Score</TableHead>
                      <TableHead className="font-semibold text-slate-600">Applied</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applicants.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400"><Users size={40} className="mx-auto mb-2 opacity-20" /><p className="text-sm">No applicants found</p></TableCell></TableRow>
                    ) : (
                      applicants.map((applicant) => (
                        <TableRow key={applicant.id} className="cursor-pointer hover:bg-slate-50 border-b border-slate-100" onClick={() => router.push(`/admin/recruitment/${applicant.applicantId}`)}>
                          <TableCell className="px-6" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(applicant.applicantId)} onChange={() => toggleSelect(applicant.applicantId)} className="rounded border-slate-300" /></TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{applicant.fullName}</span>
                              <span className="font-mono text-[10px] text-slate-400 mt-0.5">{applicant.applicantId}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">{applicant.townCity}, {applicant.region}</TableCell>
                          <TableCell><StatusBadge status={applicant.status} /></TableCell>
                          <TableCell className="text-sm font-semibold text-slate-700">{applicant.averageScore ?? "—"}</TableCell>
                          <TableCell className="text-xs text-slate-500 font-medium">{new Date(applicant.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
                  <p className="text-xs text-slate-500 font-medium">Page {page} of {totalPages}</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8 text-xs bg-white"><ChevronLeft size={14} className="mr-1" /> Prev</Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8 text-xs bg-white">Next <ChevronRight size={14} className="ml-1" /></Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0 space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border border-slate-100 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base font-bold">Recruitment Funnel</CardTitle>
                <CardDescription>Applicant flow through pipeline stages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" fontSize={12} stroke="#94a3b8" />
                      <YAxis dataKey="name" type="category" width={110} fontSize={12} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {funnelData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-100 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base font-bold">Status Distribution</CardTitle>
                <CardDescription>Current breakdown of all applicant statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value">
                        {statusDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
