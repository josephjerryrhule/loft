"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  User, 
  CreditCard, 
  Crown, 
  BookOpen, 
  Users, 
  DollarSign, 
  History,
  Download,
  Calendar,
  Phone,
  Mail,
  Shield,
  Activity,
  Award,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRole } from "@/lib/format-utils";
import { cn, getCurrencySymbol, formatStatusLabel } from "@/lib/utils";

interface UserProfileDashboardProps {
  user: any;
  currency?: string;
  backUrl?: string;
  backLabel?: string;
  viewerId?: string;
  viewerRole?: string;
}

export function UserProfileDashboard({ 
  user, 
  currency = "GHS",
  backUrl = "/admin/users",
  backLabel = "Back to User CRM Table",
  viewerId,
  viewerRole
}: UserProfileDashboardProps) {
  const router = useRouter();
  const currencySymbol = getCurrencySymbol(currency);
  const [activeTab, setActiveTab] = useState<"overview" | "billing" | "library" | "referrals" | "commissions" | "activity" | "hierarchy">("overview");

  const isAmbassador = ["AFFILIATE", "TEAM_LEADER", "MANAGER", "OPERATIONS_MANAGER"].includes(user.role);
  const canViewFull = user.canViewFull !== undefined ? user.canViewFull : true;
  const hasHierarchy = ["OPERATIONS_MANAGER", "MANAGER", "TEAM_LEADER"].includes(user.role);

  // Compute stats for overview cards
  const stats = useMemo(() => {
    const totalSpent = user.orders
      .filter((o: any) => ["PAID", "COMPLETED"].includes(o.paymentStatus))
      .reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0) + 
      user.subscriptions
      .filter((sub: any) => ["ACTIVE", "PAID"].includes(sub.status) || sub.paymentStatus === "COMPLETED")
      .reduce((sum: number, sub: any) => sum + Number(sub.plan.price), 0);

    const activeSub = user.subscriptions.find((sub: any) => sub.status === "ACTIVE" && new Date(sub.endDate) >= new Date());
    const subscriptionPlan = activeSub ? activeSub.plan.name : "None";

    const totalCommissions = user.commissions
      .filter((c: any) => c.status === "PAID")
      .reduce((sum: number, c: any) => sum + Number(c.amount), 0);

    const pendingCommissions = user.commissions
      .filter((c: any) => c.status === "PENDING" || c.status === "APPROVED")
      .reduce((sum: number, c: any) => sum + Number(c.amount), 0);

    return {
      totalSpent,
      subscriptionPlan,
      totalCommissions,
      pendingCommissions,
      purchasesCount: user.orders.filter((o: any) => ["PAID", "COMPLETED"].includes(o.paymentStatus)).length,
      referralsCount: user.referrals.length
    };
  }, [user]);

  // Handle consolidated profile data export to CSV
  const handleExportProfile = () => {
    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    let csvContent = "\uFEFF";

    // 1. Account Summary
    csvContent += "=== ACCOUNT SUMMARY ===\n";
    csvContent += "Name,Email,Phone,Role,Status,Joined Date,Ambassador Code,Linked Ambassador\n";
    csvContent += `${escapeCSV(`${user.firstName || ''} ${user.lastName || ''}`.trim())},`;
    csvContent += `${escapeCSV(user.email)},`;
    csvContent += `${escapeCSV(user.phoneNumber || '')},`;
    csvContent += `${escapeCSV(user.role)},`;
    csvContent += `${escapeCSV(user.status)},`;
    csvContent += `${escapeCSV(new Date(user.createdAt).toLocaleDateString())},`;
    csvContent += `${escapeCSV(user.ambassadorId || '')},`;
    csvContent += `${escapeCSV(user.referredBy ? `${user.referredBy.firstName || ''} ${user.referredBy.lastName || ''} (${user.referredBy.email})` : 'Organic')}\n\n`;

    // 2. Subscriptions History
    csvContent += "=== SUBSCRIPTIONS HISTORY ===\n";
    csvContent += "Plan Name,Status,Gateway,Price,Start Date,End Date\n";
    if (user.subscriptions.length === 0) {
      csvContent += "No subscriptions found\n";
    } else {
      user.subscriptions.forEach((sub: any) => {
        csvContent += `${escapeCSV(sub.plan?.name)},`;
        csvContent += `${escapeCSV(sub.status)},`;
        csvContent += `${escapeCSV(sub.gateway || '')},`;
        csvContent += `${escapeCSV(sub.plan?.price)},`;
        csvContent += `${escapeCSV(new Date(sub.startDate).toLocaleDateString())},`;
        csvContent += `${escapeCSV(new Date(sub.endDate).toLocaleDateString())}\n`;
      });
    }
    csvContent += "\n";

    // 3. Purchase History
    csvContent += "=== ORDER HISTORY ===\n";
    csvContent += "Product,Quantity,Total Amount,Payment Status,Date\n";
    if (user.orders.length === 0) {
      csvContent += "No orders found\n";
    } else {
      user.orders.forEach((order: any) => {
        csvContent += `${escapeCSV(order.product?.title || 'Unknown Product')},`;
        csvContent += `${escapeCSV(order.quantity)},`;
        csvContent += `${escapeCSV(order.totalAmount)},`;
        csvContent += `${escapeCSV(order.paymentStatus)},`;
        csvContent += `${escapeCSV(new Date(order.createdAt).toLocaleDateString())}\n`;
      });
    }
    csvContent += "\n";

    // 4. Referrals (if applicable)
    if (isAmbassador) {
      csvContent += "=== REFERRED CUSTOMERS ===\n";
      csvContent += "Name,Email,Role,Status,Joined Date\n";
      if (user.referrals.length === 0) {
        csvContent += "No referred users found\n";
      } else {
        user.referrals.forEach((ref: any) => {
          csvContent += `${escapeCSV(`${ref.firstName || ''} ${ref.lastName || ''}`.trim())},`;
          csvContent += `${escapeCSV(ref.email)},`;
          csvContent += `${escapeCSV(ref.role)},`;
          csvContent += `${escapeCSV(ref.status)},`;
          csvContent += `${escapeCSV(new Date(ref.createdAt).toLocaleDateString())}\n`;
        });
      }
      csvContent += "\n";

      // 5. Commissions
      csvContent += "=== COMMISSIONS HISTORY ===\n";
      csvContent += "Order ID,Amount,Status,Date\n";
      if (user.commissions.length === 0) {
        csvContent += "No commissions found\n";
      } else {
        user.commissions.forEach((comm: any) => {
          csvContent += `${escapeCSV(comm.orderId)},`;
          csvContent += `${escapeCSV(comm.amount)},`;
          csvContent += `${escapeCSV(comm.status)},`;
          csvContent += `${escapeCSV(new Date(comm.createdAt).toLocaleDateString())}\n`;
        });
      }
      csvContent += "\n";
    }

    // 6. Flipbook Activity
    csvContent += "=== FLIPBOOK PROGRESS ===\n";
    csvContent += "Flipbook Title,Child Profile,Last Page Read,Last Accessed Date\n";
    if (user.flipbookProgress.length === 0) {
      csvContent += "No reading activity found\n";
    } else {
      user.flipbookProgress.forEach((prog: any) => {
        csvContent += `${escapeCSV(prog.flipbook?.title)},`;
        csvContent += `${escapeCSV(prog.childProfile?.name || 'Main Profile')},`;
        csvContent += `${escapeCSV(prog.lastPageRead)},`;
        csvContent += `${escapeCSV(new Date(prog.lastAccessedAt).toLocaleDateString())}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `loft_user_profile_${user.id}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Back Button & Actions */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <Link href={backUrl} className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-[#E87154] transition-colors gap-2">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
        <Button
          variant="outline"
          className="bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-850 rounded-xl font-bold h-11 self-start sm:self-auto"
          onClick={handleExportProfile}
        >
          <Download className="mr-2 h-4 w-4 text-[#E87154]" />
          Export Profile Report
        </Button>
      </div>

      {/* User Header Profile Card */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-orange-100 to-rose-100 dark:from-slate-800 dark:to-slate-850 opacity-40"></div>
        <CardContent className="pt-20 px-6 sm:px-8 pb-8 relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20 border-4 border-white dark:border-slate-900 shadow-lg">
              <AvatarImage src={user.profilePictureUrl || ""} />
              <AvatarFallback className="bg-slate-100 text-slate-500 font-extrabold text-2xl">
                {user.firstName?.[0] || user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-slate-850 dark:text-white">
                  {user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'No Name'}
                </h1>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-800 border-none px-2.5 py-1">
                  {formatRole(user.role)}
                </Badge>
                <Badge 
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider border-none px-2.5 py-0.5",
                    user.status === "ACTIVE" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                    user.status === "SUSPENDED" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                    user.status === "BANNED" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}
                >
                  {user.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 font-medium mt-2 flex-wrap">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {user.email}</span>
                {user.phoneNumber && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {user.phoneNumber}</span>}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> 
                  Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
          {user.ambassadorId && (
            <div className="flex flex-col items-start md:items-end gap-1.5 p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">Ambassador ID</span>
              <span className="font-mono text-base font-black text-indigo-700 dark:text-indigo-400">{user.ambassadorId}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
          <CardContent className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Spending</span>
              <CreditCard className="h-5 w-5 text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 p-1 rounded-lg" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">{currencySymbol}{stats.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">{stats.purchasesCount} billing records</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
          <CardContent className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Premium Plan</span>
              <Crown className="h-5 w-5 text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-1 rounded-lg" />
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white truncate">{stats.subscriptionPlan}</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Current billing status</p>
            </div>
          </CardContent>
        </Card>

        {isAmbassador ? (
          <>
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
              <CardContent className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paid Commission</span>
                  <DollarSign className="h-5 w-5 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 p-1 rounded-lg" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">{currencySymbol}{stats.totalCommissions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Settled earnings</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
              <CardContent className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Earnings</span>
                  <Award className="h-5 w-5 text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-1 rounded-lg" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">{currencySymbol}{stats.pendingCommissions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">{stats.referralsCount} active referrals</p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
              <CardContent className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reading Streak</span>
                  <BookOpen className="h-5 w-5 text-pink-500 bg-pink-50 dark:bg-pink-950/30 p-1 rounded-lg" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                    {user.childProfiles.reduce((max: number, c: any) => Math.max(max, c.readingStreak || 0), 0)} days
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">{user.childProfiles.length} kid profiles linked</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
              <CardContent className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Linked Ambassador</span>
                  <Users className="h-5 w-5 text-[#E87154] bg-orange-50 dark:bg-orange-950/30 p-1 rounded-lg" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-850 dark:text-white truncate">
                    {user.referredBy ? `${user.referredBy.firstName || ''} ${user.referredBy.lastName || ''}`.trim() || user.referredBy.email : "Organic"}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Referred channel</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto gap-6 sm:gap-8 pb-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "text-sm font-bold pb-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
            activeTab === "overview" 
              ? "border-[#E87154] text-[#E87154]" 
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <User className="h-4 w-4" />
          Overview
        </button>

        {canViewFull && (
          <button
            onClick={() => setActiveTab("billing")}
            className={cn(
              "text-sm font-bold pb-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === "billing" 
                ? "border-[#E87154] text-[#E87154]" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            <CreditCard className="h-4 w-4" />
            Billing & Purchases
          </button>
        )}

        {canViewFull && (
          <button
            onClick={() => setActiveTab("library")}
            className={cn(
              "text-sm font-bold pb-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === "library" 
                ? "border-[#E87154] text-[#E87154]" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            <BookOpen className="h-4 w-4" />
            Library & Kids
          </button>
        )}

        {isAmbassador && canViewFull && (
          <>
            <button
              onClick={() => setActiveTab("referrals")}
              className={cn(
                "text-sm font-bold pb-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === "referrals" 
                  ? "border-[#E87154] text-[#E87154]" 
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <Users className="h-4 w-4" />
              Referrals List
            </button>

            <button
              onClick={() => setActiveTab("commissions")}
              className={cn(
                "text-sm font-bold pb-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === "commissions" 
                  ? "border-[#E87154] text-[#E87154]" 
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <DollarSign className="h-4 w-4" />
              Commissions & Payouts
            </button>
          </>
        )}

        {hasHierarchy && (
          <button
            onClick={() => setActiveTab("hierarchy")}
            className={cn(
              "text-sm font-bold pb-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === "hierarchy"
                ? "border-[#E87154] text-[#E87154]" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            <Shield className="h-4 w-4 text-[#E87154]" />
            {user.role === "OPERATIONS_MANAGER" ? "Org Hierarchy" : "Managed Team"}
          </button>
        )}

        {canViewFull && (
          <button
            onClick={() => setActiveTab("activity")}
            className={cn(
              "text-sm font-bold pb-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === "activity" 
                ? "border-[#E87154] text-[#E87154]" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            <History className="h-4 w-4" />
            Audit Logs
          </button>
        )}
      </div>

      {/* Tabs Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Account Details Card */}
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl md:col-span-2">
              <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#E87154]" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 text-sm">
                  <div>
                    <span className="block text-xs font-bold text-slate-450 uppercase tracking-wider pb-1">First Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{user.firstName || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-450 uppercase tracking-wider pb-1">Last Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{user.lastName || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-450 uppercase tracking-wider pb-1">Email Address</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{user.email}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-450 uppercase tracking-wider pb-1">Phone Number</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{user.phoneNumber || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-450 uppercase tracking-wider pb-1">Account Role</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatRole(user.role)}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-450 uppercase tracking-wider pb-1">Account Status</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{user.status}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-450 uppercase tracking-wider pb-1">Member Since</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-450 uppercase tracking-wider pb-1">Last Activity Logged</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {user.activityLogs[0] 
                        ? new Date(user.activityLogs[0].createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) 
                        : "No activity recorded"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hierarchy & Relations Card */}
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
              <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-500" />
                  CRM Relationships
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Ambassador Connection */}
                <div>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Linked Ambassador / Promoter</span>
                  {user.referredBy ? (
                    <Link 
                      href={`/admin/users/${user.referredBy.id}`} 
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 transition-colors border border-slate-100/50 dark:border-slate-800"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs font-bold">
                          {user.referredBy.firstName?.[0] || user.referredBy.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-white truncate flex items-center gap-1">
                          {`${user.referredBy.firstName || ''} ${user.referredBy.lastName || ''}`.trim() || user.referredBy.email}
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold">{user.referredBy.ambassadorId || "No Code"}</span>
                      </div>
                    </Link>
                  ) : (
                    <div className="text-xs font-semibold text-slate-450 italic p-3 bg-slate-50 dark:bg-slate-850 rounded-xl">
                      Organic client (No linked ambassador)
                    </div>
                  )}
                </div>

                {/* Manager / Leader Connections */}
                {user.managerId && (
                  <div>
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Team Manager</span>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl">
                      Manager ID: <span className="font-mono">{user.managerId}</span>
                    </div>
                  </div>
                )}

                {user.teamLeaderId && (
                  <div>
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Team Leader</span>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl">
                      Team Leader ID: <span className="font-mono">{user.teamLeaderId}</span>
                    </div>
                  </div>
                )}

                {/* If Ambassador: show simple referrals overview */}
                {isAmbassador && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-850">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                      <span>Total Referrals Managed</span>
                      <span className="text-indigo-650 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-lg">{stats.referralsCount} customers</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: Billing & Purchases */}
        {activeTab === "billing" && (
          <div className="space-y-8">
            {/* Active Plan details banner */}
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  Premium Subscriptions History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {user.subscriptions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Crown className="h-10 w-10 mx-auto opacity-20 mb-2 text-[#E87154]" />
                    <p className="font-bold text-sm">No subscription plans found for this user.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-none bg-slate-50/50 dark:bg-slate-800/40">
                        <TableHead className="pl-6 font-bold text-slate-500">Plan Name</TableHead>
                        <TableHead className="font-bold text-slate-500">Child Profile</TableHead>
                        <TableHead className="font-bold text-slate-500">Status</TableHead>
                        <TableHead className="font-bold text-slate-500">Gateway</TableHead>
                        <TableHead className="font-bold text-slate-500">Price</TableHead>
                        <TableHead className="font-bold text-slate-500">Start Date</TableHead>
                        <TableHead className="font-bold text-slate-500">Renewal/End Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.subscriptions.map((sub: any) => (
                        <TableRow key={sub.id} className="border-slate-50 dark:border-slate-850">
                          <TableCell className="pl-6 font-bold text-slate-800 dark:text-slate-200">
                            {sub.plan?.name || "Unknown Plan"}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-500">
                            {sub.childProfile ? (
                              <Badge variant="secondary" className="font-bold">
                                {sub.childProfile.name}{sub.childProfile.username ? ` (@${sub.childProfile.username})` : ""}
                              </Badge>
                            ) : (
                              <span className="text-xs italic">Account Level</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-wider border-none px-2 py-0.5",
                                sub.status === "ACTIVE" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                                sub.status === "CANCELLED" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                                sub.status === "EXPIRED" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              )}
                            >
                              {formatStatusLabel(sub.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-slate-500 text-xs uppercase">{sub.gateway || "STRIPE"}</TableCell>
                          <TableCell className="font-bold text-slate-800 dark:text-slate-250">{currencySymbol}{Number(sub.plan?.price || 0).toFixed(2)}</TableCell>
                          <TableCell className="text-xs text-slate-500 font-semibold">{new Date(sub.startDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs text-slate-500 font-semibold">{new Date(sub.endDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Orders list card */}
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#E87154]" />
                  Order & Billing Transactions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {user.orders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <CreditCard className="h-10 w-10 mx-auto opacity-20 mb-2" />
                    <p className="font-bold text-sm">No transaction records found.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-none bg-slate-50/50 dark:bg-slate-800/40">
                        <TableHead className="pl-6 font-bold text-slate-500">Order ID</TableHead>
                        <TableHead className="font-bold text-slate-500">Purchased Item</TableHead>
                        <TableHead className="font-bold text-slate-500">Qty</TableHead>
                        <TableHead className="font-bold text-slate-500">Amount Paid</TableHead>
                        <TableHead className="font-bold text-slate-500">Status</TableHead>
                        <TableHead className="font-bold text-slate-500">Payment Status</TableHead>
                        <TableHead className="font-bold text-slate-500">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.orders.map((order: any) => (
                        <TableRow key={order.id} className="border-slate-50 dark:border-slate-850">
                          <TableCell className="pl-6 font-mono text-[11px] font-black text-slate-500">
                            {order.id.slice(-8).toUpperCase()}
                          </TableCell>
                          <TableCell className="font-bold text-slate-850 dark:text-slate-200">
                            {order.product?.title || "Standard Product"}
                          </TableCell>
                          <TableCell className="font-bold text-slate-700 dark:text-slate-350">{order.quantity}</TableCell>
                          <TableCell className="font-black text-slate-850 dark:text-slate-100">{currencySymbol}{Number(order.totalAmount).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[9px] font-extrabold uppercase px-2 py-0.5 border-none bg-slate-50 dark:bg-slate-850">
                              {order.orderStatus || "COMPLETED"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-wider border-none px-2 py-0.5",
                                ["PAID", "COMPLETED"].includes(order.paymentStatus) && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                                order.paymentStatus === "PENDING" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                                ["FAILED", "REFUNDED"].includes(order.paymentStatus) && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              )}
                            >
                              {formatStatusLabel(order.paymentStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-550 font-semibold">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 3: Library & Kids */}
        {activeTab === "library" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Child Profiles Card */}
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl md:col-span-1">
              <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#E87154]" />
                  Kids Profiles ({user.childProfiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {user.childProfiles.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <p className="text-sm font-semibold">No children profiles created.</p>
                  </div>
                ) : (
                  user.childProfiles.map((child: any) => (
                    <div 
                      key={child.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100/50 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-white dark:border-slate-800 shadow-sm">
                          <AvatarFallback className="bg-[#E87154]/10 text-[#E87154] font-black text-sm">
                            {child.name?.[0] || "K"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-850 dark:text-white">{child.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold tracking-wider">{child.username ? `@${child.username}` : "No username"}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-black text-emerald-650 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          {child.readingStreak || 0}d streak
                        </span>
                        <span className="text-[10px] text-slate-450 font-bold">{child.flipbookProgress?.length || 0} books read</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Reading Activity progress table */}
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl md:col-span-2 overflow-hidden">
              <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-500" />
                  Flipbook Reading Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {user.flipbookProgress.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <BookOpen className="h-10 w-10 mx-auto opacity-20 mb-2 text-[#E87154]" />
                    <p className="font-bold text-sm">No library activity or book progress found.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-none bg-slate-50/50 dark:bg-slate-800/40">
                        <TableHead className="pl-6 font-bold text-slate-500">Book Title</TableHead>
                        <TableHead className="font-bold text-slate-500">Reader Profile</TableHead>
                        <TableHead className="font-bold text-slate-500">Current Progress</TableHead>
                        <TableHead className="font-bold text-slate-500">Last Read Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.flipbookProgress.map((prog: any) => {
                        const totalPages = prog.flipbook?.totalPages || 30;
                        const pct = Math.min(100, Math.round((prog.lastPageRead / totalPages) * 100));
                        return (
                          <TableRow key={prog.id} className="border-slate-50 dark:border-slate-850">
                            <TableCell className="pl-6 font-bold text-slate-850 dark:text-slate-200">
                              {prog.flipbook?.title || "Interactive Book"}
                            </TableCell>
                            <TableCell className="font-bold text-slate-600">
                              <Badge variant="outline" className="font-black bg-indigo-50/50 text-indigo-650 dark:bg-indigo-950/20 border-none">
                                {prog.childProfile?.name || "Parent Account"}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex flex-col gap-1.5 min-w-[120px] max-w-[200px]">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                                  <span>Page {prog.lastPageRead} of {totalPages}</span>
                                  <span>{pct}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-550 rounded-full" style={{ width: `${pct}%` }}></div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 font-semibold">
                              {new Date(prog.lastAccessedAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

          </div>
        )}

        {/* Tab 4: Referrals List (Ambassadors only) */}
        {activeTab === "referrals" && isAmbassador && (
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" />
                Referred Platform Users ({user.referrals.length})
              </CardTitle>
              <CardDescription>Customers registered on the platform using this ambassador's referral code.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {user.referrals.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Users className="h-10 w-10 mx-auto opacity-20 mb-2 text-[#E87154]" />
                  <p className="font-bold text-sm">No customers referred yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-none bg-slate-50/50 dark:bg-slate-800/40">
                      <TableHead className="pl-6 font-bold text-slate-500">Name</TableHead>
                      <TableHead className="font-bold text-slate-500">Email</TableHead>
                      <TableHead className="font-bold text-slate-500">Role</TableHead>
                      <TableHead className="font-bold text-slate-500">Status</TableHead>
                      <TableHead className="font-bold text-slate-500">Billing Tier</TableHead>
                      <TableHead className="font-bold text-slate-500">Joined Date</TableHead>
                      <TableHead className="text-right pr-6 font-bold text-slate-500">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.referrals.map((ref: any) => {
                      const activeSub = ref.subscriptions?.find((sub: any) => sub.paymentStatus === "COMPLETED" && Number(sub.plan.price) > 0);
                      const activeFreeSub = ref.subscriptions?.find((sub: any) => sub.paymentStatus === "COMPLETED_FREE" || Number(sub.plan.price) === 0);

                      let subBadge = <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider border-none bg-slate-100 text-slate-500 px-2 py-0.5">Free</Badge>;
                      if (activeSub) {
                        subBadge = <Badge className="text-[10px] font-bold uppercase tracking-wider border-none px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Paying ({activeSub.plan.name})</Badge>;
                      } else if (activeFreeSub) {
                        subBadge = <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider border-none bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5">Free ({activeFreeSub.plan.name})</Badge>;
                      }

                      return (
                        <TableRow key={ref.id} className="border-slate-50 dark:border-slate-850">
                          <TableCell className="pl-6 font-bold text-slate-850 dark:text-slate-200">
                            {ref.firstName ? `${ref.firstName} ${ref.lastName || ''}`.trim() : "No Name"}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-500">{ref.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider border-none bg-slate-50 dark:bg-slate-850">
                              {formatRole(ref.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-wider border-none px-2 py-0.5",
                                ref.status === "ACTIVE" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                                ref.status === "SUSPENDED" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                                ref.status === "BANNED" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              )}
                            >
                              {ref.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{subBadge}</TableCell>
                          <TableCell className="text-xs text-slate-500 font-semibold">{new Date(ref.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right pr-6">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="font-bold text-xs text-[#E87154] hover:text-[#E87154]/80 p-0 h-auto"
                              onClick={() => router.push(`/admin/users/${ref.id}`)}
                            >
                              CRM Profile
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab 5: Commissions & Payouts (Ambassadors only) */}
        {activeTab === "commissions" && isAmbassador && (
          <div className="space-y-8">
            {/* Commission Earnings table */}
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  Commission Transactions History
                </CardTitle>
                <CardDescription>Commissions earned on purchases made by referred users.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {user.commissions.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <DollarSign className="h-10 w-10 mx-auto opacity-20 mb-2 text-[#E87154]" />
                    <p className="font-bold text-sm">No commissions recorded yet.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-none bg-slate-50/50 dark:bg-slate-800/40">
                        <TableHead className="pl-6 font-bold text-slate-500">Order ID</TableHead>
                        <TableHead className="font-bold text-slate-500">Earned Amount</TableHead>
                        <TableHead className="font-bold text-slate-500">Status</TableHead>
                        <TableHead className="font-bold text-slate-500">Date Recorded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.commissions.map((comm: any) => (
                        <TableRow key={comm.id} className="border-slate-50 dark:border-slate-850">
                          <TableCell className="pl-6 font-mono text-xs font-black text-slate-500">
                            {comm.orderId || "ORDER_LEVEL"}
                          </TableCell>
                          <TableCell className="font-black text-emerald-600">{currencySymbol}{Number(comm.amount).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge 
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-wider border-none px-2 py-0.5",
                                comm.status === "PAID" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                                comm.status === "PENDING" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                                comm.status === "APPROVED" && "bg-indigo-100 text-indigo-750 dark:bg-indigo-900/30 dark:text-indigo-400",
                                comm.status === "CANCELLED" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              )}
                            >
                              {comm.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 font-semibold">{new Date(comm.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Payout requests table */}
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  Payout Requests
                </CardTitle>
                <CardDescription>Payout settlements claimed by the ambassador.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {user.payoutRequests.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Award className="h-10 w-10 mx-auto opacity-20 mb-2" />
                    <p className="font-bold text-sm">No payout requests found.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-none bg-slate-50/50 dark:bg-slate-800/40">
                        <TableHead className="pl-6 font-bold text-slate-500">Requested Amt</TableHead>
                        <TableHead className="font-bold text-slate-500">Status</TableHead>
                        <TableHead className="font-bold text-slate-500">Request Date</TableHead>
                        <TableHead className="font-bold text-slate-500">Settled Date</TableHead>
                        <TableHead className="font-bold text-slate-500">Notes/Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.payoutRequests.map((req: any) => (
                        <TableRow key={req.id} className="border-slate-50 dark:border-slate-850">
                          <TableCell className="pl-6 font-black text-slate-800 dark:text-slate-200">{currencySymbol}{Number(req.amount).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge 
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-wider border-none px-2 py-0.5",
                                req.status === "PAID" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                                req.status === "PENDING" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                                req.status === "REJECTED" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              )}
                            >
                              {req.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 font-semibold">{new Date(req.requestedAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs text-slate-500 font-semibold">
                            {req.paidAt ? new Date(req.paidAt).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 font-medium max-w-[200px] truncate">{req.adminNotes || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 6: Audit Logs */}
        {activeTab === "activity" && (
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#E87154]" />
                User Activity Audit Trail
              </CardTitle>
              <CardDescription>Most recent events and system actions logged for this account.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {user.activityLogs.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Activity className="h-10 w-10 mx-auto opacity-20 mb-2" />
                  <p className="font-bold text-sm">No activity logs recorded.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-none bg-slate-50/50 dark:bg-slate-800/40">
                      <TableHead className="pl-6 font-bold text-slate-500">Event Action</TableHead>
                      <TableHead className="font-bold text-slate-500">Detailed Message / Description</TableHead>
                      <TableHead className="font-bold text-slate-500">IP Address</TableHead>
                      <TableHead className="font-bold text-slate-500">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.activityLogs.map((log: any) => (
                      <TableRow key={log.id} className="border-slate-50 dark:border-slate-850">
                        <TableCell className="pl-6 py-4">
                          <Badge variant="outline" className="text-[10px] font-extrabold uppercase px-2 py-0.5 tracking-wider bg-slate-50 dark:bg-slate-800 border-none">
                            {log.actionType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-650 dark:text-slate-300 text-sm max-w-[400px] break-words">
                          {log.description || "System action performed."}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-400">{log.ipAddress || "127.0.0.1"}</TableCell>
                        <TableCell className="text-xs text-slate-500 font-semibold whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab: Hierarchy */}
        {activeTab === "hierarchy" && hasHierarchy && user.managedHierarchy && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {user.managedHierarchy.type === "TEAM_LEADER" && (
              <TeamLeaderHierarchy members={user.managedHierarchy.members} />
            )}
            {user.managedHierarchy.type === "MANAGER" && (
              <ManagerHierarchy affiliates={user.managedHierarchy.affiliates} />
            )}
            {user.managedHierarchy.type === "OPERATIONS_MANAGER" && (
              <OperationsManagerHierarchy staff={user.managedHierarchy.staff} />
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function TeamLeaderHierarchy({ members }: { members: any[] }) {
  const router = useRouter();
  return (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
        <CardTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Users className="h-4 w-4 text-[#E87154]" />
          Team Members ({members.length})
        </CardTitle>
        <CardDescription>Affiliates in this team leader's team.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {members.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            No team members found.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/40">
              <TableRow className="border-none">
                <TableHead className="pl-6 font-bold">Name</TableHead>
                <TableHead className="font-bold">Email</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Billing Status</TableHead>
                <TableHead className="text-right pr-6 font-bold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m: any) => {
                const activeSub = m.subscriptions?.find((sub: any) => sub.paymentStatus === "COMPLETED" && Number(sub.plan.price) > 0);
                const activeFreeSub = m.subscriptions?.find((sub: any) => sub.paymentStatus === "COMPLETED_FREE" || Number(sub.plan.price) === 0);

                let subBadge = <Badge variant="outline" className="bg-slate-50 text-slate-500 border-none font-bold">Free</Badge>;
                if (activeSub) {
                  subBadge = <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none font-bold">Paying ({activeSub.plan.name})</Badge>;
                } else if (activeFreeSub) {
                  subBadge = <Badge variant="outline" className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-none font-bold">Free ({activeFreeSub.plan.name})</Badge>;
                }

                return (
                  <TableRow key={m.id} className="border-slate-50 dark:border-slate-850">
                    <TableCell className="pl-6 font-bold">{m.name}</TableCell>
                    <TableCell className="font-semibold text-slate-500">{m.email}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px] font-bold uppercase border-none px-2 py-0.5", m.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" : "bg-slate-100 text-slate-500")}>
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{subBadge}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="sm" className="text-[#E87154] font-bold text-xs p-0 h-auto" onClick={() => router.push(`/admin/users/${m.id}`)}>
                        CRM Profile
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ManagerHierarchy({ affiliates }: { affiliates: any[] }) {
  const router = useRouter();
  
  // Group affiliates by role
  const teamLeaders = affiliates.filter((a: any) => a.role === "TEAM_LEADER");
  const directAffiliates = affiliates.filter((a: any) => a.role === "AFFILIATE");

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Team Leaders and their teams */}
      {teamLeaders.map((tl: any) => (
        <Card key={tl.id} className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4 bg-slate-50/30 dark:bg-slate-800/10">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Team: {tl.name} <span className="text-xs text-slate-400 font-normal">({tl.email})</span>
                </CardTitle>
                <CardDescription>Managed Team Leader | {tl.teamMembers.length} members</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl font-bold self-start sm:self-auto" onClick={() => router.push(`/admin/users/${tl.id}`)}>
                View Leader Profile
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {tl.teamMembers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 italic text-sm">
                No members in this team leader's team yet.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/30 dark:bg-slate-800/20">
                  <TableRow className="border-none">
                    <TableHead className="pl-6 font-bold text-xs">Member Name</TableHead>
                    <TableHead className="font-bold text-xs">Email</TableHead>
                    <TableHead className="font-bold text-xs">Status</TableHead>
                    <TableHead className="font-bold text-xs">Billing Status</TableHead>
                    <TableHead className="text-right pr-6 font-bold text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tl.teamMembers.map((m: any) => {
                    const activeSub = m.subscriptions?.find((sub: any) => sub.paymentStatus === "COMPLETED" && Number(sub.plan.price) > 0);
                    const activeFreeSub = m.subscriptions?.find((sub: any) => sub.paymentStatus === "COMPLETED_FREE" || Number(sub.plan.price) === 0);

                    let subBadge = <Badge variant="outline" className="bg-slate-50 text-slate-500 border-none font-bold scale-90">Free</Badge>;
                    if (activeSub) {
                      subBadge = <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none font-bold scale-90">Paying</Badge>;
                    } else if (activeFreeSub) {
                      subBadge = <Badge variant="outline" className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-none font-bold scale-90">Free ({activeFreeSub.plan.name})</Badge>;
                    }

                    return (
                      <TableRow key={m.id} className="border-slate-50 dark:border-slate-850">
                        <TableCell className="pl-6 font-bold text-sm">{m.name}</TableCell>
                        <TableCell className="font-semibold text-xs text-slate-500">{m.email}</TableCell>
                        <TableCell>
                          <Badge className={cn("text-[9px] font-bold uppercase border-none px-1.5 py-0.5", m.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" : "bg-slate-100 text-slate-500")}>
                            {m.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{subBadge}</TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="ghost" size="sm" className="text-[#E87154] font-bold text-xs p-0 h-auto" onClick={() => router.push(`/admin/users/${m.id}`)}>
                            CRM Profile
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Direct Affiliates Card */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
          <CardTitle className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-500" />
            Direct Affiliates ({directAffiliates.length})
          </CardTitle>
          <CardDescription>Affiliates under this manager not assigned to a team leader.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {directAffiliates.length === 0 ? (
            <div className="text-center py-8 text-slate-400 italic text-sm">
              No direct affiliates.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/40">
                <TableRow className="border-none">
                  <TableHead className="pl-6 font-bold text-xs">Affiliate Name</TableHead>
                  <TableHead className="font-bold text-xs">Email</TableHead>
                  <TableHead className="font-bold text-xs">Status</TableHead>
                  <TableHead className="font-bold text-xs">Billing Status</TableHead>
                  <TableHead className="text-right pr-6 font-bold text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {directAffiliates.map((m: any) => {
                  const activeSub = m.subscriptions?.find((sub: any) => sub.paymentStatus === "COMPLETED" && Number(sub.plan.price) > 0);
                  const activeFreeSub = m.subscriptions?.find((sub: any) => sub.paymentStatus === "COMPLETED_FREE" || Number(sub.plan.price) === 0);

                  let subBadge = <Badge variant="outline" className="bg-slate-50 text-slate-500 border-none font-bold scale-90">Free</Badge>;
                  if (activeSub) {
                    subBadge = <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none font-bold scale-90">Paying</Badge>;
                  } else if (activeFreeSub) {
                    subBadge = <Badge variant="outline" className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-none font-bold scale-90">Free ({activeFreeSub.plan.name})</Badge>;
                  }

                  return (
                    <TableRow key={m.id} className="border-slate-50 dark:border-slate-850">
                      <TableCell className="pl-6 font-bold text-sm">{m.name}</TableCell>
                      <TableCell className="font-semibold text-xs text-slate-500">{m.email}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[9px] font-bold uppercase border-none px-1.5 py-0.5", m.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" : "bg-slate-100 text-slate-500")}>
                          {m.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{subBadge}</TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="sm" className="text-[#E87154] font-bold text-xs p-0 h-auto" onClick={() => router.push(`/admin/users/${m.id}`)}>
                          CRM Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OperationsManagerHierarchy({ staff }: { staff: any[] }) {
  const router = useRouter();
  
  // Organize staff
  const managers = staff.filter((s: any) => s.role === "MANAGER");
  
  // Find team leaders and affiliates under each manager
  const getManagerAffiliates = (managerId: string) => {
    return staff.filter((s: any) => s.managerId === managerId);
  };
  
  const getTeamMembers = (teamLeaderId: string) => {
    return staff.filter((s: any) => s.teamLeaderId === teamLeaderId);
  };

  // Find unassigned staff
  const unassignedTeamLeaders = staff.filter((s: any) => s.role === "TEAM_LEADER" && !s.managerId);
  const unassignedAffiliates = staff.filter((s: any) => s.role === "AFFILIATE" && !s.managerId && !s.teamLeaderId);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 gap-6">
        {managers.map((mgr: any) => {
          const managerStaff = getManagerAffiliates(mgr.id);
          const teamLeaders = managerStaff.filter((s: any) => s.role === "TEAM_LEADER");
          const directAffs = managerStaff.filter((s: any) => s.role === "AFFILIATE");

          return (
            <Card key={mgr.id} className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
              <CardHeader className="bg-indigo-50/40 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <CardTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Crown className="h-5 w-5 text-indigo-500" />
                      Manager: {mgr.name}
                    </CardTitle>
                    <CardDescription className="font-semibold text-xs text-indigo-600 dark:text-indigo-400 mt-1">{mgr.email} | {managerStaff.length} direct reports</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl font-bold self-start sm:self-auto" onClick={() => router.push(`/admin/users/${mgr.id}`)}>
                    View Manager
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Team leaders under this manager */}
                {teamLeaders.map((tl: any) => {
                  const members = getTeamMembers(tl.id);
                  return (
                    <div key={tl.id} className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/20 dark:bg-slate-950/10">
                      <div className="flex justify-between items-center p-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-sm flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          Team: {tl.name} <span className="text-xs text-slate-400 font-normal">({tl.email})</span>
                        </span>
                        <Button variant="ghost" size="sm" className="text-[#E87154] font-bold text-xs p-0 h-auto" onClick={() => router.push(`/admin/users/${tl.id}`)}>
                          View Leader
                        </Button>
                      </div>
                      <div className="p-0">
                        {members.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 italic">No team members assigned.</div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                            {members.map((m: any) => (
                              <div key={m.id} className="flex justify-between items-center p-3 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-50 dark:border-slate-855">
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-slate-850 dark:text-white">{m.name}</span>
                                  <span className="text-[10px] text-slate-500 font-medium">{m.email}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="text-[#E87154] font-bold text-xs p-0 h-auto" onClick={() => router.push(`/admin/users/${m.id}`)}>
                                  View CRM
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Direct Affiliates under this manager */}
                {directAffs.length > 0 && (
                  <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-3 bg-slate-50/30 dark:bg-slate-800/10 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Direct Affiliates ({directAffs.length})</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                      {directAffs.map((m: any) => (
                        <div key={m.id} className="flex justify-between items-center p-3 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-50 dark:border-slate-855">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-850 dark:text-white">{m.name}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{m.email}</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-[#E87154] font-bold text-xs p-0 h-auto" onClick={() => router.push(`/admin/users/${m.id}`)}>
                            View CRM
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Unassigned / Floating Staff */}
      {(unassignedTeamLeaders.length > 0 || unassignedAffiliates.length > 0) && (
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-100/50 dark:bg-slate-800/10 border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-stone-500" />
              Unassigned Staff / Ambassadors
            </CardTitle>
            <CardDescription>Ambassadors not assigned under any manager.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {unassignedTeamLeaders.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Team Leaders</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unassignedTeamLeaders.map((m: any) => (
                    <div key={m.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-850 dark:text-white">{m.name}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{m.email}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-[#E87154] font-bold text-xs p-0 h-auto" onClick={() => router.push(`/admin/users/${m.id}`)}>
                        View CRM
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {unassignedAffiliates.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Affiliates</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unassignedAffiliates.map((m: any) => (
                    <div key={m.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-850 dark:text-white">{m.name}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{m.email}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-[#E87154] font-bold text-xs p-0 h-auto" onClick={() => router.push(`/admin/users/${m.id}`)}>
                        View CRM
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
