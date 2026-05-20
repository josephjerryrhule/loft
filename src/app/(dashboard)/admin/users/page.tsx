"use client";

import { useEffect, useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Loader2, 
  ArrowUpDown, 
  Download, 
  Users as UsersIcon, 
  CreditCard, 
  Crown, 
  TrendingUp, 
  UserCheck
} from "lucide-react";
import { AddUserDialog } from "@/components/admin/AddUserDialog";
import { UserActions } from "@/components/admin/UserActions";
import { TablePagination } from "@/components/ui/table-pagination";
import { getAllUsers } from "@/app/actions/admin";
import { getSystemSettings } from "@/app/actions/settings";
import { formatRole } from "@/lib/format-utils";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { cn, getCurrencySymbol } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  role: string;
  status: string;
  profilePictureUrl: string | null;
  ambassadorId: string | null;
  ambassadorExpiry: Date | null;
  createdAt: Date;
  managerId: string | null;
  teamLeaderId: string | null;
  referredById: string | null;
  referredBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    ambassadorId: string | null;
  } | null;
  subscriptionStatus: string;
  totalSpent: number;
  numPurchases: number;
  commissionEarned: number;
  referralsCount: number;
  lastActivity: Date;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("GHS");
  
  // Table State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  
  // Minimalist CRM Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Sorting State
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Load user & setting records
  useEffect(() => {
    async function loadData() {
      try {
        const [data, settings] = await Promise.all([
          getAllUsers(),
          getSystemSettings()
        ]);
        setUsers(data as any);
        setCurrency(settings?.currency || "GHS");
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const currencySymbol = getCurrencySymbol(currency);

  // User classification lists for dialogue reassignments
  const operationsManagers = useMemo(() => 
    users.filter(u => u.role === "OPERATIONS_MANAGER")
         .map(u => ({ id: u.id, name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email })),
    [users]
  );

  const managers = useMemo(() => 
    users.filter(u => u.role === "MANAGER")
         .map(u => ({ id: u.id, name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email })),
    [users]
  );

  const teamLeaders = useMemo(() => 
    users.filter(u => u.role === "TEAM_LEADER")
         .map(u => ({ id: u.id, name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email })),
    [users]
  );

  const ambassadorsList = useMemo(() => {
    return users
      .filter((u) => ["AFFILIATE", "TEAM_LEADER", "MANAGER", "OPERATIONS_MANAGER"].includes(u.role))
      .map((u) => ({
        id: u.id,
        name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
        ambassadorId: u.ambassadorId,
      }));
  }, [users]);

  // CRM Statistics Summary
  const kpis = useMemo(() => {
    const totalCount = users.length;
    const customerCount = users.filter(u => ["CUSTOMER", "PARENT"].includes(u.role)).length;
    const activeSubscribers = users.filter(u => u.subscriptionStatus !== "Inactive").length;
    const ambassadorCount = users.filter(u => ["AFFILIATE", "TEAM_LEADER", "MANAGER", "OPERATIONS_MANAGER"].includes(u.role)).length;
    const totalSpending = users.reduce((sum, u) => sum + (u.totalSpent || 0), 0);

    return {
      totalCount,
      customerCount,
      activeSubscribers,
      ambassadorCount,
      totalSpending
    };
  }, [users]);

  // Click sorting handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  // Perform filtering
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search matches email, name, phone
      const matchesSearch = !searchQuery || 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.firstName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.lastName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.phoneNumber || "").includes(searchQuery);

      // Role Filter
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

      // Status Filter
      const matchesStatus = statusFilter === "ALL" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Sort Filtered Records
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let aVal: any = "";
      let bVal: any = "";

      if (sortField === "name") {
        aVal = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
        bVal = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
      } else if (sortField === "createdAt") {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortField, sortDirection]);

  // Page slice
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + itemsPerPage);

  // Consolidated Client CSV Exporter
  const handleExport = () => {
    const headers = [
      "Name",
      "Email",
      "Phone Number",
      "Role",
      "Status",
      "Ambassador ID",
      "Subscription Status",
      "Total Spent",
      "Purchases Count",
      "Commissions Earned",
      "Referrals Count",
      "Signup Date",
      "Last Activity Date"
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = sortedUsers.map(user => [
      escapeCSV(`${user.firstName || ''} ${user.lastName || ''}`.trim()),
      escapeCSV(user.email),
      escapeCSV(user.phoneNumber || ''),
      escapeCSV(user.role),
      escapeCSV(user.status),
      escapeCSV(user.ambassadorId || ''),
      escapeCSV(user.subscriptionStatus || 'Inactive'),
      escapeCSV(`${currency} ${(user.totalSpent || 0).toFixed(2)}`),
      escapeCSV(user.numPurchases || 0),
      escapeCSV(`${currency} ${(user.commissionEarned || 0).toFixed(2)}`),
      escapeCSV(user.referralsCount || 0),
      escapeCSV(new Date(user.createdAt).toLocaleDateString()),
      escapeCSV(user.lastActivity ? new Date(user.lastActivity).toLocaleDateString() : '')
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `loft_users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        title="User Management & CRM"
        subtitle="Manage user roles, verify subscription status, and link ambassadors."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="bg-white hover:bg-slate-50 border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 rounded-xl font-bold h-11"
              onClick={handleExport}
            >
              <Download className="mr-2 h-4 w-4 text-[#E87154]" />
              Export CSV
            </Button>
            <AddUserDialog />
          </div>
        }
      />

      {/* KPI stats section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardContent className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
              <UsersIcon className="h-5 w-5 text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 p-1 rounded-lg" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-850 dark:text-white">{kpis.totalCount}</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Platform Accounts</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardContent className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customers</span>
              <UserCheck className="h-5 w-5 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 p-1 rounded-lg" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-850 dark:text-white">{kpis.customerCount}</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Parents & Customers</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardContent className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subscribers</span>
              <Crown className="h-5 w-5 text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-1 rounded-lg" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-850 dark:text-white">{kpis.activeSubscribers}</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Active Premium Plans</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardContent className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ambassadors</span>
              <TrendingUp className="h-5 w-5 text-[#E87154] bg-orange-50 dark:bg-orange-950/30 p-1 rounded-lg" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-850 dark:text-white">{kpis.ambassadorCount}</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Affiliate Team Network</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden col-span-2 md:col-span-1">
          <CardContent className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales</span>
              <CreditCard className="h-5 w-5 text-pink-500 bg-pink-50 dark:bg-pink-950/30 p-1 rounded-lg" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-850 dark:text-white">{currencySymbol}{kpis.totalSpending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Platform Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CRM Simplified Filters */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search users by name or email..." 
                className="pl-11 h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-semibold focus-visible:ring-[#E87154] shadow-inner w-full" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Role Filter */}
            <div className="w-full md:w-[220px]">
              <select 
                className="flex h-12 w-full items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-2 text-sm focus:outline-none border-none font-bold text-slate-650 dark:text-slate-350 shadow-inner"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="OPERATIONS_MANAGER">Operations Manager</option>
                <option value="MANAGER">Manager</option>
                <option value="TEAM_LEADER">Team Leader</option>
                <option value="AFFILIATE">Affiliate / Ambassador</option>
                <option value="CUSTOMER">Customer</option>
                <option value="PARENT">Parent</option>
                <option value="FINANCE">Finance</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-[200px]">
              <select 
                className="flex h-12 w-full items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-2 text-sm focus:outline-none border-none font-bold text-slate-650 dark:text-slate-350 shadow-inner"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="BANNED">Banned</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CRM Users Clean Table */}
      <div className="rounded-2xl border-none shadow-md overflow-hidden bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-none bg-slate-50/50 dark:bg-slate-800/40">
                <TableHead className="pl-6 py-4 font-bold text-slate-500 cursor-pointer select-none" onClick={() => handleSort("name")}>
                  <div className="flex items-center gap-1.5">
                    User Details
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </TableHead>
                <TableHead className="font-bold text-slate-500">Role</TableHead>
                <TableHead className="font-bold text-slate-500">Subscription Status</TableHead>
                <TableHead className="font-bold text-slate-500 cursor-pointer select-none" onClick={() => handleSort("createdAt")}>
                  <div className="flex items-center gap-1.5">
                    Joined Date
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </TableHead>
                <TableHead className="font-bold text-slate-500">Status</TableHead>
                <TableHead className="text-right pr-6 py-4 font-bold text-slate-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-10 w-10 opacity-20 text-[#E87154]" />
                      <p className="font-bold text-slate-500 dark:text-slate-400">No matching users found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {paginatedUsers.map((user) => (
                <TableRow key={user.id} className="group transition-colors border-slate-50 dark:border-slate-800">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/users/${user.id}`}>
                        <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm hover:opacity-85 transition-opacity cursor-pointer">
                          <AvatarImage src={user.profilePictureUrl || ""} />
                          <AvatarFallback className="bg-slate-100 text-slate-500 font-bold">{user.firstName?.[0] || user.email[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex flex-col">
                        <Link href={`/admin/users/${user.id}`} className="font-bold text-sm text-slate-900 dark:text-white hover:text-[#E87154] transition-colors">
                          {user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'No Name'}
                        </Link>
                        <span className="text-xs text-slate-400 font-medium">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-850 border-none px-2.5 py-1">
                      {formatRole(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5",
                        user.subscriptionStatus !== "Inactive" 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40" 
                          : "bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-800/30 dark:text-slate-500 dark:border-slate-800"
                      )}
                    >
                      {user.subscriptionStatus !== "Inactive" ? `Active (${user.subscriptionStatus})` : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-550 font-semibold">
                    {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.status === "ACTIVE" ? "default" : "destructive"}
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider border-none px-2 py-0.5",
                        user.status === "ACTIVE" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                        user.status === "SUSPENDED" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                        user.status === "BANNED" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <UserActions 
                      user={user} 
                      managers={managers} 
                      teamLeaders={teamLeaders} 
                      operationsManagers={operationsManagers}
                      ambassadors={ambassadorsList}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900">
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredUsers.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );
}
