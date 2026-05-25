"use client";

import { useEffect, useState, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminCommissionActions, AdminPayoutActions } from "@/components/admin/AdminFinanceActions";
import { TablePagination } from "@/components/ui/table-pagination";
import { 
  Loader2, 
  CheckCircle2, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  CheckSquare, 
  Square, 
  DollarSign, 
  Wallet, 
  TrendingUp, 
  Clock,
  Download
} from "lucide-react";
import { 
  getFinanceData, 
  bulkApproveCommissions,
  bulkApproveUserCommissions,
  bulkApproveSelectedCommissions
} from "@/app/actions/admin";
import { getAdminPayoutQueue } from "@/app/actions/payout";
import { toast } from "sonner";
import { PremiumKPICard } from "@/components/dashboard/PremiumKPICard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { formatRole, formatUTCDate, formatUTCDateShort } from "@/lib/format-utils";
import { cn } from "@/lib/utils";

export default function AdminFinancePage() {
  const [stats, setStats] = useState<any>(null);
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [recentCommissions, setRecentCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutItemsPerPage, setPayoutItemsPerPage] = useState(12);
  const [commissionPage, setCommissionPage] = useState(1);
  const [commissionItemsPerPage, setCommissionItemsPerPage] = useState(12);

  // Search & Batch approval states
  const [selectedTab, setSelectedTab] = useState<"grouped" | "transactions">("grouped");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedCommissionIds, setSelectedCommissionIds] = useState<string[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [weeklyApproving, setWeeklyApproving] = useState<Record<string, boolean>>({});

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      const [financeData, payoutQueueData] = await Promise.all([
        getFinanceData(),
        getAdminPayoutQueue()
      ]);
      setStats(financeData.stats);
      setRecentCommissions(financeData.recentCommissions);
      if (payoutQueueData && !payoutQueueData.error) {
        setPayoutRequests(payoutQueueData.payouts || []);
      }
    } catch (error) {
      console.error("Failed to load finance data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  const handleBulkApprove = async () => {
    const pendingCount = recentCommissions.filter(c => c.status === "PENDING").length;
    
    if (pendingCount === 0) {
      toast.error("No pending commissions to approve");
      return;
    }

    if (!confirm(`Are you sure you want to approve all ${pendingCount} pending commissions?`)) {
      return;
    }

    setBulkApproving(true);
    try {
      const result = await bulkApproveCommissions();
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`Successfully approved ${result.approved} commissions!`);
        await loadFinanceData();
      }
    } catch (error) {
      toast.error("Failed to approve commissions");
    } finally {
      setBulkApproving(false);
    }
  };

  const handleApproveUserAll = async (userId: string, email: string, pendingCount: number) => {
    if (!confirm(`Are you sure you want to approve all ${pendingCount} pending commissions for ${email}?`)) {
      return;
    }

    setBulkApproving(true);
    try {
      const result = await bulkApproveUserCommissions(userId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`Successfully approved ${result.approvedCount} commissions for ${email}!`);
        await loadFinanceData();
      }
    } catch (error) {
      toast.error("Failed to approve commissions");
    } finally {
      setBulkApproving(false);
    }
  };

  const handleBatchApproveSelected = async () => {
    if (selectedCommissionIds.length === 0) return;
    
    if (!confirm(`Are you sure you want to approve ${selectedCommissionIds.length} selected commissions?`)) {
      return;
    }

    setBulkApproving(true);
    try {
      const result = await bulkApproveSelectedCommissions(selectedCommissionIds);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`Successfully approved ${result.approvedCount} selected commissions!`);
        setSelectedCommissionIds([]);
        await loadFinanceData();
      }
    } catch (error) {
      toast.error("Failed to approve selected commissions");
    } finally {
      setBulkApproving(false);
    }
  };

  const handleApproveWeekly = async (weekKey: string, ids: string[], label: string) => {
    if (ids.length === 0) return;
    
    if (!confirm(`Are you sure you want to approve ${ids.length} pending commissions for ${label}?`)) {
      return;
    }

    setWeeklyApproving(prev => ({ ...prev, [weekKey]: true }));
    try {
      const result = await bulkApproveSelectedCommissions(ids);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`Successfully approved ${result.approvedCount} commissions for ${label}!`);
        await loadFinanceData();
      }
    } catch (error) {
      toast.error("Failed to approve weekly commissions");
    } finally {
      setWeeklyApproving(prev => ({ ...prev, [weekKey]: false }));
    }
  };

  const exportToCSV = () => {
    // 1. Group by user and then by week start
    const userWeekGroups: Record<string, {
      userName: string;
      userEmail: string;
      userRole: string;
      weekLabel: string;
      pending: Record<string, number>;
      approved: Record<string, number>;
      paid: Record<string, number>;
      total: Record<string, number>;
      count: number;
    }> = {};

    filteredCommissions.forEach((comm: any) => {
      const userId = comm.userId || "unknown";
      const userName = `${comm.user?.firstName || ""} ${comm.user?.lastName || ""}`.trim() || "Ambassador";
      const userEmail = comm.user?.email || "Unknown";
      const userRole = comm.user?.role || "AFFILIATE";
      
      // Calculate Monday start date for the week in UTC
      const date = new Date(comm.createdAt);
      const day = date.getUTCDay();
      const diff = date.getUTCDate() - (day === 0 ? 6 : day - 1);
      const startOfWeek = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff, 0, 0, 0, 0));
      const endOfWeek = new Date(Date.UTC(startOfWeek.getUTCFullYear(), startOfWeek.getUTCMonth(), startOfWeek.getUTCDate() + 6, 23, 59, 59, 999));
      
      const weekStartStr = formatUTCDate(startOfWeek);
      const weekEndStr = formatUTCDate(endOfWeek);
      const weekLabel = `${weekStartStr} - ${weekEndStr}`;
      
      // Composite key: userId + weekKey
      const key = `${userId}_${startOfWeek.toISOString()}`;
      
      if (!userWeekGroups[key]) {
        userWeekGroups[key] = {
          userName,
          userEmail,
          userRole,
          weekLabel,
          pending: {},
          approved: {},
          paid: {},
          total: {},
          count: 0
        };
      }
      
      const curr = comm.currency || "GHS";
      const amount = Number(comm.amount);
      
      if (comm.status === "PENDING") {
        userWeekGroups[key].pending[curr] = (userWeekGroups[key].pending[curr] || 0) + amount;
      } else if (comm.status === "APPROVED") {
        userWeekGroups[key].approved[curr] = (userWeekGroups[key].approved[curr] || 0) + amount;
      } else if (comm.status === "PAID") {
        userWeekGroups[key].paid[curr] = (userWeekGroups[key].paid[curr] || 0) + amount;
      }
      
      userWeekGroups[key].total[curr] = (userWeekGroups[key].total[curr] || 0) + amount;
      userWeekGroups[key].count += 1;
    });

    // 2. Define CSV Headers
    const headers = [
      "User Name",
      "User Email",
      "User Role",
      "Week (Mon-Sun)",
      "Pending GHS",
      "Pending USD",
      "Approved GHS",
      "Approved USD",
      "Paid GHS",
      "Paid USD",
      "Total GHS",
      "Total USD",
      "Transaction Count"
    ];

    // 3. Build CSV rows
    const rows = Object.values(userWeekGroups).map(group => {
      return [
        `"${group.userName.replace(/"/g, '""')}"`,
        `"${group.userEmail.replace(/"/g, '""')}"`,
        `"${group.userRole}"`,
        `"${group.weekLabel}"`,
        (group.pending["GHS"] || 0).toFixed(2),
        (group.pending["USD"] || 0).toFixed(2),
        (group.approved["GHS"] || 0).toFixed(2),
        (group.approved["USD"] || 0).toFixed(2),
        (group.paid["GHS"] || 0).toFixed(2),
        (group.paid["USD"] || 0).toFixed(2),
        (group.total["GHS"] || 0).toFixed(2),
        (group.total["USD"] || 0).toFixed(2),
        group.count
      ];
    });

    // 4. Combine headers and rows
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    // 5. Trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `weekly-commissions-report-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter raw commissions
  const filteredCommissions = recentCommissions.filter((comm: any) => {
    const matchesSearch = searchQuery
      ? (comm.user?.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (`${comm.user?.firstName || ""} ${comm.user?.lastName || ""}`).toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesStatus = statusFilter === "ALL" ? true : comm.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group commissions by user
  const groupedByUser = filteredCommissions.reduce((acc: any[], comm: any) => {
    const userId = comm.userId;
    if (!userId) return acc;
    
    const existing = acc.find(item => item.user.id === userId);
    
    const pendingAmountByCurrency: Record<string, number> = existing ? { ...existing.pendingAmountByCurrency } : {};
    const approvedAmountByCurrency: Record<string, number> = existing ? { ...existing.approvedAmountByCurrency } : {};
    const paidAmountByCurrency: Record<string, number> = existing ? { ...existing.paidAmountByCurrency } : {};
    
    const curr = comm.currency || "GHS";
    const amount = Number(comm.amount);
    
    if (comm.status === "PENDING") {
      pendingAmountByCurrency[curr] = (pendingAmountByCurrency[curr] || 0) + amount;
    } else if (comm.status === "APPROVED") {
      approvedAmountByCurrency[curr] = (approvedAmountByCurrency[curr] || 0) + amount;
    } else if (comm.status === "PAID") {
      paidAmountByCurrency[curr] = (paidAmountByCurrency[curr] || 0) + amount;
    }
    
    const pendingCount = (existing?.pendingCount || 0) + (comm.status === "PENDING" ? 1 : 0);
    const totalCount = (existing?.totalCount || 0) + 1;
    
    if (existing) {
      existing.pendingCount = pendingCount;
      existing.totalCount = totalCount;
      existing.pendingAmountByCurrency = pendingAmountByCurrency;
      existing.approvedAmountByCurrency = approvedAmountByCurrency;
      existing.paidAmountByCurrency = paidAmountByCurrency;
      existing.commissions.push(comm);
    } else {
      acc.push({
        user: comm.user || { id: userId, email: "Unknown", firstName: "Unknown", lastName: "User", role: "AFFILIATE" },
        pendingCount,
        totalCount,
        pendingAmountByCurrency,
        approvedAmountByCurrency,
        paidAmountByCurrency,
        commissions: [comm]
      });
    }
    return acc;
  }, []);

  // Format currency symbols
  const formatAggregatedAmounts = (amountsObj: Record<string, number>) => {
    const parts = Object.entries(amountsObj)
      .filter(([_, val]) => val > 0)
      .map(([curr, val]) => {
        const symbol = curr === "USD" ? "$" : curr === "EUR" ? "€" : curr === "GBP" ? "£" : "₵";
        return `${symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      });
    return parts.length > 0 ? parts.join(" + ") : "₵0.00";
  };

  // Group commissions by week start (Monday)
  const groupCommissionsByWeek = (commissions: any[]) => {
    const groups: Record<string, any[]> = {};
    
    commissions.forEach(comm => {
      const date = new Date(comm.createdAt);
      const day = date.getUTCDay(); // 0 is Sunday, 1 is Monday, etc.
      // Adjust Sunday (0) to 6 (so we subtract 6 days), and Monday-Saturday (1-6) to subtract (day - 1) days.
      const diff = date.getUTCDate() - (day === 0 ? 6 : day - 1);
      const startOfWeek = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff, 0, 0, 0, 0));
      const weekKey = startOfWeek.toISOString();
      
      if (!groups[weekKey]) {
        groups[weekKey] = [];
      }
      groups[weekKey].push(comm);
    });
    
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0])) // sort descending (most recent first)
      .map(([weekKey, comms]) => {
        const start = new Date(weekKey);
        const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6, 23, 59, 59, 999));
        
        const label = `Week of ${formatUTCDateShort(start)} - ${formatUTCDate(end)}`;
        return {
          weekKey,
          label,
          commissions: comms
        };
      });
  };

  // Selection Checkbox Handlers
  const pendingFilteredCommissions = filteredCommissions.filter(c => c.status === "PENDING");
  const pendingFilteredIds = pendingFilteredCommissions.map(c => c.id);
  const isAllSelected = pendingFilteredIds.length > 0 && pendingFilteredIds.every(id => selectedCommissionIds.includes(id));
  const isSomeSelected = pendingFilteredIds.length > 0 && pendingFilteredIds.some(id => selectedCommissionIds.includes(id)) && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCommissionIds(prev => prev.filter(id => !pendingFilteredIds.includes(id)));
    } else {
      setSelectedCommissionIds(prev => {
        const unique = new Set([...prev, ...pendingFilteredIds]);
        return Array.from(unique);
      });
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedCommissionIds(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleTabChange = (tab: "grouped" | "transactions") => {
    setSelectedTab(tab);
    setCommissionPage(1);
    setSelectedCommissionIds([]);
  };

  const payoutTotalPages = Math.ceil(payoutRequests.length / payoutItemsPerPage);
  const payoutStartIndex = (payoutPage - 1) * payoutItemsPerPage;
  const paginatedPayouts = payoutRequests.slice(payoutStartIndex, payoutStartIndex + payoutItemsPerPage);

  const isGrouped = selectedTab === "grouped";
  const activeItemsLength = isGrouped ? groupedByUser.length : filteredCommissions.length;
  const commissionTotalPages = Math.ceil(activeItemsLength / commissionItemsPerPage);
  const commissionStartIndex = (commissionPage - 1) * commissionItemsPerPage;
  
  const paginatedCommissions = isGrouped 
    ? [] 
    : filteredCommissions.slice(commissionStartIndex, commissionStartIndex + commissionItemsPerPage);
    
  const paginatedGrouped = isGrouped 
    ? groupedByUser.slice(commissionStartIndex, commissionStartIndex + commissionItemsPerPage) 
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Finance & Payouts"
        subtitle="Manage ambassador commissions, payout requests, and system revenue"
      />

      {/* Finance KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PremiumKPICard
          title="Total Revenue"
          value={`GHS ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          theme="primary"
          trend={{ value: "From orders", label: "Completed sales", type: "up" }}
        />
        <PremiumKPICard
          title="Commissions Paid"
          value={`GHS ${stats.paidCommissions.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={CheckCircle2}
          theme="success"
          description="Total paid to ambassadors"
        />
        <PremiumKPICard
          title="Pending Approval"
          value={`GHS ${stats.pendingCommissions.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={Clock}
          theme="warning"
          description="Awaiting admin review"
        />
        <PremiumKPICard
          title="Approved (Ready)"
          value={`GHS ${stats.approvedCommissions.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={Wallet}
          theme="info"
          description="Ready for payout"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-1">
        {/* Payout Requests */}
        <Card className="border-none shadow-md overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-bold">Weekly Payout Queue</CardTitle>
                    <CardDescription>Automatic matured statements for review and payment</CardDescription>
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Wallet size={20} />
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="pl-6">Ambassador</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPayouts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                      No payouts in queue.
                    </TableCell>
                  </TableRow>
                )}
                {paginatedPayouts.map((req: any) => {
                  const startStr = formatUTCDateShort(req.weekStart);
                  const endStr = formatUTCDate(req.weekEnd);
                  
                  return (
                    <TableRow key={req.id} className="group transition-colors">
                      <TableCell className="pl-6 font-bold text-slate-900">{req.user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 border-none">
                          {formatRole(req.user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-slate-700">
                        {startStr} - {endStr}
                      </TableCell>
                      <TableCell className="font-black text-slate-900">
                        {req.amountGHS > 0 && (
                          <div className="text-sm font-black text-slate-900">₵{req.amountGHS.toFixed(2)}</div>
                        )}
                        {req.amountUSD > 0 && (
                          <div className="text-sm font-black text-slate-900">${req.amountUSD.toFixed(2)}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={cn(
                              "text-[10px] font-bold uppercase tracking-wider border-none",
                              req.status === "PAID" && "bg-emerald-100 text-emerald-700",
                              req.status === "APPROVED" && "bg-blue-100 text-blue-700 animate-pulse",
                              req.status === "SIGNED" && "bg-purple-100 text-purple-700",
                              req.status === "REVIEW_NEEDED" && "bg-red-100 text-red-700 animate-bounce",
                              req.status === "PAYABLE" && "bg-amber-100 text-amber-700"
                          )}
                        >
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <AdminPayoutActions payout={req} onSuccess={loadFinanceData} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="p-4 border-t border-slate-50">
              <TablePagination
                currentPage={payoutPage}
                totalPages={payoutTotalPages}
                itemsPerPage={payoutItemsPerPage}
                totalItems={payoutRequests.length}
                onPageChange={setPayoutPage}
                onItemsPerPageChange={(value) => {
                  setPayoutItemsPerPage(value);
                  setPayoutPage(1);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Commissions */}
        <Card className="border-none shadow-md overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-50 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  Recent Commissions
                </CardTitle>
                <CardDescription>Manage and approve earned ambassador rewards</CardDescription>
                
                {/* View Tabs */}
                <div className="flex items-center gap-1.5 mt-2 bg-slate-50 p-1 rounded-xl w-fit border border-slate-100">
                  <Button
                    size="sm"
                    variant={isGrouped ? "secondary" : "ghost"}
                    onClick={() => handleTabChange("grouped")}
                    className={cn(
                      "text-xs font-bold px-3 py-1.5 h-8 rounded-lg",
                      isGrouped ? "bg-white text-slate-900 shadow-sm border border-slate-100/50" : "text-slate-500 hover:text-slate-950"
                    )}
                  >
                    <Users size={13} className="mr-1.5" /> Grouped by User
                  </Button>
                  <Button
                    size="sm"
                    variant={!isGrouped ? "secondary" : "ghost"}
                    onClick={() => handleTabChange("transactions")}
                    className={cn(
                      "text-xs font-bold px-3 py-1.5 h-8 rounded-lg",
                      !isGrouped ? "bg-white text-slate-900 shadow-sm border border-slate-100/50" : "text-slate-500 hover:text-slate-950"
                    )}
                  >
                    <TrendingUp size={13} className="mr-1.5" /> All Transactions
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <Button
                  onClick={exportToCSV}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                {recentCommissions.some(c => c.status === "PENDING") && (
                  <Button 
                    onClick={handleBulkApprove}
                    disabled={bulkApproving}
                    size="sm"
                    className="gap-2 bg-[#E87154] hover:bg-[#D66144] shadow-lg shadow-[#E87154]/20 font-bold"
                  >
                    {bulkApproving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Approve All Pending
                  </Button>
                )}
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-[#E87154]">
                    <TrendingUp size={20} />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 border-b border-slate-50 bg-slate-50/20">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search recipient name or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCommissionPage(1);
                    setSelectedCommissionIds([]);
                  }}
                  className="pl-9 pr-4 h-10 w-full bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E87154]/20 focus:border-[#E87154] transition-all placeholder:text-slate-400 text-slate-900"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCommissionPage(1);
                    setSelectedCommissionIds([]);
                  }}
                  className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E87154]/20 focus:border-[#E87154] transition-all text-slate-900"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending Approval</option>
                  <option value="APPROVED">Approved (Ready)</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
            </div>

            {/* Batch Action Banner for Checkboxes */}
            {!isGrouped && selectedCommissionIds.length > 0 && (
              <div className="bg-[#FFFAF5] border-b border-[#E87154]/20 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-200">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-md bg-[#E87154]/10 text-[#E87154] flex items-center justify-center font-black text-xs">
                    {selectedCommissionIds.length}
                  </div>
                  <span className="text-xs font-semibold text-slate-700">commissions selected for batch approval</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedCommissionIds([])}
                    className="text-xs text-slate-500 hover:text-slate-700 h-8 font-bold"
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleBatchApproveSelected}
                    disabled={bulkApproving}
                    className="bg-[#E87154] hover:bg-[#D66144] text-white text-xs font-bold px-4 py-2 rounded-xl h-8 flex items-center gap-1.5 shadow-md shadow-[#E87154]/15"
                  >
                    {bulkApproving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Approve Selected
                  </Button>
                </div>
              </div>
            )}

            {/* Tab 1: Grouped by User */}
            {isGrouped && (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="w-10 pl-6"></TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">Pending Items</TableHead>
                    <TableHead>Total Pending</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedGrouped.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                        No grouped commissions matching filters.
                      </TableCell>
                    </TableRow>
                  )}
                  {paginatedGrouped.map((row: any) => {
                    const hasPending = row.pendingCount > 0;
                    const isExpanded = !!expandedUsers[row.user.id];
                    return (
                      <>
                        <TableRow key={row.user.id} className="group transition-colors border-b border-slate-50">
                          <TableCell className="pl-6 w-10">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 text-slate-500"
                              onClick={() => toggleUserExpanded(row.user.id)}
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </Button>
                          </TableCell>
                          <TableCell className="font-bold text-slate-900">
                            <div className="flex flex-col">
                              <span>{`${row.user.firstName || ""} ${row.user.lastName || ""}`.trim() || "Ambassador"}</span>
                              <span className="text-xs text-slate-400 font-normal">{row.user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 border-none">
                              {formatRole(row.user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-semibold text-slate-700">
                            {row.pendingCount > 0 ? (
                              <Badge className="bg-amber-100 text-amber-800 border-none text-[10px] font-bold">
                                {row.pendingCount} pending
                              </Badge>
                            ) : (
                              <span className="text-slate-400 text-xs">0 pending</span>
                            )}
                          </TableCell>
                          <TableCell className="font-black text-emerald-600">
                            {formatAggregatedAmounts(row.pendingAmountByCurrency)}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex items-center justify-end gap-2">
                              {hasPending && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveUserAll(row.user.id, row.user.email, row.pendingCount)}
                                  disabled={bulkApproving}
                                  className="h-8 bg-[#E87154] hover:bg-[#D66144] text-white text-xs font-bold rounded-lg shadow-sm"
                                >
                                  {bulkApproving ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  ) : (
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                  )}
                                  Approve All
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {/* Accordion Expanded Details */}
                        {isExpanded && (
                          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                            <TableCell colSpan={6} className="p-4 pl-12 pr-6">
                              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 overflow-hidden">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-3 flex items-center gap-1.5">
                                  <Clock size={12} /> Pending & Recent Commissions Details
                                </h4>
                                <Table>
                                  <TableHeader className="bg-slate-50/50">
                                    <TableRow className="border-none">
                                      <TableHead className="text-xs">Type</TableHead>
                                      <TableHead className="text-xs">Amount</TableHead>
                                      <TableHead className="text-xs">Status</TableHead>
                                      <TableHead className="text-xs">Date</TableHead>
                                      <TableHead className="text-right text-xs">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {groupCommissionsByWeek(row.commissions).map((group: any) => (
                                      <Fragment key={group.weekKey}>
                                        {/* Week Header Row */}
                                        <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 border-b border-slate-100">
                                          <TableCell colSpan={5} className="py-1.5 pl-4">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">{group.label}</span>
                                                <Badge variant="outline" className="bg-slate-200/60 text-slate-600 border-none text-[9px] font-bold py-0 h-4">
                                                  {group.commissions.length} {group.commissions.length === 1 ? 'txn' : 'txns'}
                                                </Badge>
                                              </div>
                                              {group.commissions.some((c: any) => c.status === "PENDING") && (
                                                <Button
                                                  size="sm"
                                                  onClick={() => handleApproveWeekly(
                                                    group.weekKey, 
                                                    group.commissions.filter((c: any) => c.status === "PENDING").map((c: any) => c.id),
                                                    group.label
                                                  )}
                                                  disabled={weeklyApproving[group.weekKey] || bulkApproving}
                                                  className="h-5 bg-[#E87154]/10 hover:bg-[#E87154]/20 text-[#E87154] text-[9px] font-extrabold rounded px-2 border border-[#E87154]/20 flex items-center justify-center gap-1 shadow-sm mr-2"
                                                >
                                                  {weeklyApproving[group.weekKey] ? (
                                                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                                  ) : (
                                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                                  )}
                                                  Approve Week
                                                </Button>
                                              )}
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                        {/* Commissions in this week */}
                                        {group.commissions.map((comm: any) => (
                                          <TableRow key={comm.id} className="hover:bg-slate-50/30 border-b border-slate-50 last:border-0">
                                            <TableCell className="py-2 text-sm font-medium">
                                              <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider bg-slate-50 border-none text-slate-600">
                                                {comm.sourceType === "SIGNUP" ? "Signup Bonus" : 
                                                 comm.sourceType === "SUBSCRIPTION" ? "Subscription" : 
                                                 comm.sourceType === "PRODUCT" ? "Sale" : comm.sourceType}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="py-2 font-bold text-emerald-600 text-sm">
                                              <span className="text-[9px] opacity-75 mr-0.5">{comm.currency || "GHS"}</span>
                                              {Number(comm.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="py-2">
                                              <Badge 
                                                variant="outline" 
                                                className={cn(
                                                    "text-[9px] font-bold uppercase tracking-wider",
                                                    comm.status === "PAID" && "bg-emerald-100 text-emerald-700 border-none",
                                                    comm.status === "APPROVED" && "bg-blue-100 text-blue-700 border-none",
                                                    comm.status === "PENDING" && "bg-amber-100 text-amber-700 border-none"
                                                )}
                                              >
                                                {comm.status}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="py-2 text-xs text-slate-500">
                                              {new Date(comm.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </TableCell>
                                            <TableCell className="py-2 text-right">
                                              <AdminCommissionActions id={comm.id} status={comm.status} onSuccess={loadFinanceData} />
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </Fragment>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {/* Tab 2: All Transactions (with check boxes) */}
            {!isGrouped && (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="w-12 pl-6">
                      {pendingFilteredIds.length > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSelectAll}
                          className="h-8 w-8 p-0 hover:bg-slate-100 text-[#E87154]"
                        >
                          {isAllSelected ? (
                            <CheckSquare size={16} />
                          ) : isSomeSelected ? (
                            <span className="block h-3.5 w-3.5 rounded bg-[#E87154] flex items-center justify-center text-white text-[10px] font-bold">-</span>
                          ) : (
                            <Square size={16} />
                          )}
                        </Button>
                      ) : null}
                    </TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCommissions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                        No commissions found.
                      </TableCell>
                    </TableRow>
                  )}
                  {paginatedCommissions.map((comm: any) => {
                    const isPending = comm.status === "PENDING";
                    const isSelected = selectedCommissionIds.includes(comm.id);
                    return (
                      <TableRow key={comm.id} className="group transition-colors">
                        <TableCell className="pl-6 w-12">
                          {isPending ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSelectRow(comm.id)}
                              className="h-8 w-8 p-0 hover:bg-slate-100 text-slate-500"
                            >
                              {isSelected ? (
                                <CheckSquare size={16} className="text-[#E87154]" />
                              ) : (
                                <Square size={16} />
                              )}
                            </Button>
                          ) : null}
                        </TableCell>
                        <TableCell className="font-bold text-slate-900">{comm.user?.email || "Unknown"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 border-none">
                            {comm.sourceType === "SIGNUP" ? "Signup Bonus" : 
                             comm.sourceType === "SUBSCRIPTION" ? "Subscription" : 
                             comm.sourceType === "PRODUCT" ? "Sale" : comm.sourceType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-black text-emerald-600">
                            <span className="text-[10px] opacity-70 mr-1">{comm.currency || "GHS"}</span>
                            {Number(comm.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={comm.status === "PAID" ? "default" : comm.status === "APPROVED" ? "secondary" : "outline"}
                            className={cn(
                                "text-[10px] font-bold uppercase tracking-wider",
                                comm.status === "PAID" && "bg-emerald-100 text-emerald-700 border-none",
                                comm.status === "APPROVED" && "bg-blue-100 text-blue-700 border-none",
                                comm.status === "PENDING" && "bg-amber-100 text-amber-700 border-none"
                            )}
                          >
                            {comm.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                             {new Date(comm.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <AdminCommissionActions id={comm.id} status={comm.status} onSuccess={loadFinanceData} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-50">
              <TablePagination
                currentPage={commissionPage}
                totalPages={commissionTotalPages}
                itemsPerPage={commissionItemsPerPage}
                totalItems={activeItemsLength}
                onPageChange={commissionPage => setCommissionPage(commissionPage)}
                onItemsPerPageChange={(value) => {
                  setCommissionItemsPerPage(value);
                  setCommissionPage(1);
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
