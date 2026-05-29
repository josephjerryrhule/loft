"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getManualPayments } from "@/app/actions/manual-payment";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Receipt, Wallet, ArrowDownToLine, Gift, Eye } from "lucide-react";
import { toast } from "sonner";
import { PremiumKPICard } from "@/components/dashboard/PremiumKPICard";
import { PageHeader } from "@/components/dashboard/PageHeader";

const TYPE_LABELS: Record<string, string> = {
  COMPETITION_PRIZE: "Competition Prize",
  BONUS: "Bonus",
  INCENTIVE: "Incentive",
  CORRECTION: "Correction",
  OTHER: "Other",
};

const TYPE_COLORS: Record<string, string> = {
  COMPETITION_PRIZE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  BONUS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  INCENTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  CORRECTION: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  OTHER: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export default function ManualPaymentsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getManualPayments({
        search: search || undefined,
        paymentType: typeFilter,
        status: statusFilter,
      });
      setData(result);
      setPage(1); // Reset page on filter change
    } catch (err) {
      toast.error("Failed to load manual payments");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 300); // Debounce search changes

    return () => clearTimeout(timer);
  }, [search, typeFilter, statusFilter, load]);

  const { payments = [], summary = { totalCount: 0, totalAmount: 0, totalAllocated: 0, totalBonus: 0 } } = data || {};

  // Client-side pagination
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedPayments = payments.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(payments.length / itemsPerPage);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Manual Payments"
        subtitle="Track manual payments, competition prizes, bonuses, and commission allocations"
        actions={
          <Link href="/finance/manual-payments/new">
            <Button className="bg-[#E87154] hover:bg-[#D4654A] text-white gap-2 font-bold rounded-xl h-11 px-6 shadow-sm">
              <Plus className="h-5 w-5" /> New Manual Payment
            </Button>
          </Link>
        }
      />

      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PremiumKPICard
          title="Total Payments"
          value={summary.totalCount.toString()}
          icon={Receipt}
          theme="info"
        />
        <PremiumKPICard
          title="Total Amount"
          value={`GHS ${(summary.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={Wallet}
          theme="primary"
        />
        <PremiumKPICard
          title="Applied to Commissions"
          value={`GHS ${(summary.totalAllocated ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={ArrowDownToLine}
          theme="success"
        />
        <PremiumKPICard
          title="Bonus / Extra"
          value={`GHS ${(summary.totalBonus ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={Gift}
          theme="warning"
        />
      </div>

      {/* Filters Card */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[240px]">
              <Input
                placeholder="Search by recipient name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl h-11"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48 bg-slate-50 dark:bg-slate-800 border-none rounded-xl h-11">
                  <SelectValue placeholder="Payment Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="COMPETITION_PRIZE">Competition Prize</SelectItem>
                  <SelectItem value="BONUS">Bonus</SelectItem>
                  <SelectItem value="INCENTIVE">Incentive</SelectItem>
                  <SelectItem value="CORRECTION">Correction</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-slate-50 dark:bg-slate-800 border-none rounded-xl h-11">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="VOIDED">Voided</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-primary self-center" />}
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-900 rounded-2xl">
        <CardContent className="p-0">
          {payments.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
              <Receipt className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No manual payments found</h3>
              <p className="text-sm mt-1">Create a new manual payment to get started.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                    <TableHead className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">Date</TableHead>
                    <TableHead className="py-4 font-bold text-slate-500 dark:text-slate-400">Recipient</TableHead>
                    <TableHead className="py-4 font-bold text-slate-500 dark:text-slate-400">Type</TableHead>
                    <TableHead className="py-4 font-bold text-slate-500 dark:text-slate-400 text-right">Total Amount</TableHead>
                    <TableHead className="py-4 font-bold text-slate-500 dark:text-slate-400 text-right">Allocated</TableHead>
                    <TableHead className="py-4 font-bold text-slate-500 dark:text-slate-400 text-right">Bonus</TableHead>
                    <TableHead className="py-4 font-bold text-slate-500 dark:text-slate-400">Status</TableHead>
                    <TableHead className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPayments.map((payment: any) => {
                    const date = new Date(payment.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    });
                    const recipientName = `${payment.recipient.firstName || ""} ${payment.recipient.lastName || ""}`.trim();
                    const isVoided = payment.status === "VOIDED";

                    return (
                      <TableRow
                        key={payment.id}
                        className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                      >
                        <TableCell className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          {date}
                        </TableCell>
                        <TableCell className="py-4">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {recipientName || "Unknown Ambassador"}
                            </span>
                            <span className="text-xs text-slate-400 block mt-0.5">
                              {payment.recipient.email} • ID: {payment.recipient.ambassadorId || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge className={`${TYPE_COLORS[payment.paymentType] || "bg-slate-100 text-slate-700"} border-none shadow-none rounded-lg px-2.5 py-1 font-semibold`}>
                            {TYPE_LABELS[payment.paymentType] || payment.paymentType}
                          </Badge>
                        </TableCell>
                        <TableCell className={`py-4 text-right font-extrabold ${isVoided ? "line-through text-slate-400" : "text-slate-900 dark:text-white"}`}>
                          {payment.currency} {payment.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className={`py-4 text-right font-bold ${isVoided ? "line-through text-slate-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {payment.currency} {payment.allocatedAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className={`py-4 text-right font-bold ${isVoided ? "line-through text-slate-400" : "text-[#E87154]"}`}>
                          {payment.currency} {payment.bonusAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-4">
                          {isVoided ? (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-none shadow-none rounded-lg px-2.5 py-1 font-semibold">
                              Voided
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-none shadow-none rounded-lg px-2.5 py-1 font-semibold">
                              Completed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <Link href={`/finance/manual-payments/${payment.id}`}>
                            <Button variant="outline" size="sm" className="h-9 px-3 rounded-lg gap-1 text-xs border-slate-200 hover:bg-slate-50">
                              <Eye className="h-3.5 w-3.5" /> View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-500">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, payments.length)} of {payments.length} entries
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="rounded-lg h-9"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                      disabled={page === totalPages}
                      className="rounded-lg h-9"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
