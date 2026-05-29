"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertTriangle, User, Calendar, Tag, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { PremiumKPICard } from "@/components/dashboard/PremiumKPICard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { getManualPaymentDetails, voidManualPayment } from "@/app/actions/manual-payment";

const SOURCE_LABELS: Record<string, string> = {
  SUBSCRIPTION: "Subscription",
  PRODUCT: "Product Order",
  SIGNUP: "Signup Referral",
};

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

const METHOD_LABELS: Record<string, string> = {
  MOMO: "Mobile Money",
  BANK: "Bank Transfer",
  CASH: "Cash",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminManualPaymentDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVoiding, setIsVoiding] = useState(false);

  const loadDetails = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getManualPaymentDetails(id);
      if (!data) {
        toast.error("Manual payment not found");
        router.push("/admin/manual-payments");
        return;
      }
      setPayment(data);
    } catch (err) {
      toast.error("Failed to load payment details");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleVoid = async () => {
    setIsVoiding(true);
    try {
      const res = await voidManualPayment(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Manual payment voided successfully");
        loadDetails();
      }
    } catch (err) {
      toast.error("Failed to void payment");
    } finally {
      setIsVoiding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#E87154]" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center p-12">
        <h3 className="text-lg font-bold">Manual payment not found</h3>
        <Button onClick={() => router.push("/admin/manual-payments")} className="mt-4 bg-[#E87154] hover:bg-[#D4654A] text-white">
          Back to List
        </Button>
      </div>
    );
  }

  const recipientName = `${payment.recipient.firstName || ""} ${payment.recipient.lastName || ""}`.trim();
  const isVoided = payment.status === "VOIDED";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/manual-payments")}
          className="rounded-xl h-10 px-3 gap-1 border-slate-200"
        >
          <ArrowLeft className="h-4 w-4" /> Back to List
        </Button>

        {!isVoided && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="rounded-xl h-10 px-4 gap-2 font-bold shadow-sm">
                <AlertTriangle className="h-4 w-4" /> Void Payment
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl border-none p-6 shadow-xl bg-white dark:bg-slate-900">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" /> Void this manual payment?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  This will revert all commission allocations back to <strong>PENDING</strong> status. This action cannot be undone and will restore these commissions to the automatic payout queues.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-6 flex gap-2">
                <AlertDialogCancel className="rounded-xl h-11 border-slate-200">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleVoid}
                  disabled={isVoiding}
                  className="rounded-xl h-11 bg-red-600 hover:bg-red-700 text-white font-bold gap-2"
                >
                  {isVoiding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Yes, Void Payment
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <PageHeader
        title="Manual Payment Details (Admin)"
        subtitle={`ID: ${payment.id}`}
      />

      {/* KPI summaries */}
      <div className="grid gap-4 md:grid-cols-3">
        <PremiumKPICard
          title="Total Payment"
          value={`GHS ${payment.totalAmount.toFixed(2)}`}
          icon={Tag}
          theme={isVoided ? "info" : "primary"}
          description={isVoided ? "Voided transaction" : "Total manual payout"}
        />
        <PremiumKPICard
          title="Applied to Commissions"
          value={`GHS ${payment.allocatedAmount.toFixed(2)}`}
          icon={ShieldCheck}
          theme={isVoided ? "info" : "success"}
          description="Commission offset portion"
        />
        <PremiumKPICard
          title="Remaining Bonus"
          value={`GHS ${payment.bonusAmount.toFixed(2)}`}
          icon={User}
          theme={isVoided ? "info" : "warning"}
          description="Direct incentive portion"
        />
      </div>

      {/* Main detail grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Allocation Breakdown */}
          {payment.allocations.length > 0 && (
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Commission Allocations</h3>
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                      <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                        <TableHead className="font-bold text-slate-500 text-xs py-3 pl-4">Source Type</TableHead>
                        <TableHead className="font-bold text-slate-500 text-xs">Date Earned</TableHead>
                        <TableHead className="font-bold text-slate-500 text-xs text-right pr-6">Applied Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payment.allocations.map((alloc: any) => {
                        const date = new Date(alloc.commission.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        });

                        return (
                          <TableRow
                            key={alloc.id}
                            className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                          >
                            <TableCell className="pl-4 py-4">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {SOURCE_LABELS[alloc.commission.sourceType] || alloc.commission.sourceType}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Ref ID: {alloc.commission.sourceId || "—"}
                              </span>
                            </TableCell>
                            <TableCell className="text-slate-500 text-sm">{date}</TableCell>
                            <TableCell className="text-right font-bold text-slate-900 dark:text-white pr-6">
                              GHS {alloc.amount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Card>
          )}

          {/* Payment Notes/Reason */}
          {payment.reason && (
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl p-6">
              <h3 className="text-sm font-black uppercase tracking-[0.1em] text-slate-400 mb-2">
                Reason / Description
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {payment.reason}
              </p>
            </Card>
          )}
        </div>

        {/* Metadata Sidebar */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl p-6">
            <div className="space-y-6">
              <h3 className="text-md font-black uppercase tracking-[0.1em] text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
                Transaction Info
              </h3>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">Recipient</span>
                  <div className="mt-1">
                    <span className="font-bold text-slate-900 dark:text-white block">{recipientName || "Unknown Ambassador"}</span>
                    <span className="text-xs text-slate-400 block mt-0.5">{payment.recipient.email}</span>
                    <Badge className="mt-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-none shadow-none rounded px-2 font-bold">
                      {payment.recipient.role}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">Payment Type</span>
                  <div className="mt-1">
                    <Badge className={`${TYPE_COLORS[payment.paymentType] || "bg-slate-100 text-slate-700"} border-none shadow-none rounded-lg px-2.5 py-1 font-semibold`}>
                      {TYPE_LABELS[payment.paymentType] || payment.paymentType}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">Payment Method</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">
                    {METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">Reference</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block font-mono">
                    {payment.paymentRef || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">Status</span>
                  <div className="mt-1">
                    {isVoided ? (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-none shadow-none rounded-lg px-2.5 py-1 font-semibold">
                        Voided
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-none shadow-none rounded-lg px-2.5 py-1 font-semibold">
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">Date Created</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">
                    {new Date(payment.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
