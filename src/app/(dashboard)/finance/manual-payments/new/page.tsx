"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/navigation";
import { ArrowLeft, Search, X, Loader2, Info } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import {
  searchRecipients,
  getOutstandingCommissions,
  createManualPayment,
} from "@/app/actions/manual-payment";

const SOURCE_LABELS: Record<string, string> = {
  SUBSCRIPTION: "Subscription",
  PRODUCT: "Product Order",
  SIGNUP: "Signup Referral",
};

export default function NewManualPaymentPage() {
  const router = useRouter();

  // Search recipient state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);

  // Form details state
  const [paymentType, setPaymentType] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Commissions state
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loadingCommissions, setLoadingCommissions] = useState(false);
  const [selectedCommissionIds, setSelectedCommissionIds] = useState<string[]>([]);

  // Debounce search recipient
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const users = await searchRecipients(searchQuery);
        setSearchResults(users);
      } catch (err) {
        toast.error("Failed to search recipients");
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load outstanding commissions when recipient changes
  useEffect(() => {
    if (!selectedRecipient) {
      setCommissions([]);
      setSelectedCommissionIds([]);
      return;
    }

    const loadCommissions = async () => {
      setLoadingCommissions(true);
      try {
        const data = await getOutstandingCommissions(selectedRecipient.id);
        setCommissions(data);
        setSelectedCommissionIds([]);
      } catch (err) {
        toast.error("Failed to load outstanding commissions");
      } finally {
        setLoadingCommissions(false);
      }
    };

    loadCommissions();
  }, [selectedRecipient]);

  // Handle select/deselect commissions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCommissionIds(commissions.map((c) => c.id));
    } else {
      setSelectedCommissionIds([]);
    }
  };

  const handleSelectCommission = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedCommissionIds((prev) => [...prev, id]);
    } else {
      setSelectedCommissionIds((prev) => prev.filter((cid) => cid !== id));
    }
  };

  // Calculations
  const numTotalAmount = parseFloat(totalAmount) || 0;
  const numAllocated = commissions
    .filter((c) => selectedCommissionIds.includes(c.id))
    .reduce((sum, c) => sum + c.amount, 0);
  const numBonus = Math.max(0, numTotalAmount - numAllocated);

  const isAllocationOverLimit = numAllocated > numTotalAmount;

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRecipient) {
      toast.error("Please select a recipient");
      return;
    }

    if (!paymentType) {
      toast.error("Please select a payment type");
      return;
    }

    if (numTotalAmount <= 0) {
      toast.error("Please enter a total amount greater than 0");
      return;
    }

    if (isAllocationOverLimit) {
      toast.error("Allocated commission amount exceeds total payment amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createManualPayment({
        recipientId: selectedRecipient.id,
        paymentType,
        totalAmount: numTotalAmount,
        paymentMethod: paymentMethod || undefined,
        paymentRef: paymentRef || undefined,
        reason: reason || undefined,
        commissionIds: selectedCommissionIds,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Manual payment created successfully");
        router.push(`/finance/manual-payments/${res.paymentId}`);
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/finance/manual-payments")}
          className="rounded-xl h-10 px-3 gap-1 border-slate-200"
        >
          <ArrowLeft className="h-4 w-4" /> Back to List
        </Button>
      </div>

      <PageHeader
        title="New Manual Payment"
        subtitle="Issue a manual payment and optionally allocate against outstanding commissions"
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main details card */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Payment Details</h3>
                </div>

                {/* Recipient Input & Search */}
                <div className="relative">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block ml-1 mb-2">
                    Recipient Search
                  </label>
                  {!selectedRecipient ? (
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search by name, email, or ambassador ID (type at least 2 chars)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus-visible:ring-[#E87154]"
                      />
                      {searching && (
                        <Loader2 className="absolute right-3.5 top-3.5 h-4 w-4 animate-spin text-slate-400" />
                      )}

                      {/* Dropdown search results */}
                      {searchResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {searchResults.map((user) => (
                            <div
                              key={user.id}
                              onClick={() => {
                                setSelectedRecipient(user);
                                setSearchQuery("");
                                setSearchResults([]);
                              }}
                              className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer flex items-center justify-between border-b last:border-0 border-slate-100 dark:border-slate-800"
                            >
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block">
                                  {user.firstName} {user.lastName}
                                </span>
                                <span className="text-xs text-slate-400 block mt-0.5">
                                  {user.email} • ID: {user.ambassadorId || "—"}
                                </span>
                              </div>
                              <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold border-none shadow-none rounded px-2">
                                {user.role}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {selectedRecipient.firstName} {selectedRecipient.lastName}
                        </span>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          {selectedRecipient.email} • ID: {selectedRecipient.ambassadorId || "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-[#E87154]/10 text-[#E87154] font-bold border-none shadow-none rounded px-2">
                          {selectedRecipient.role}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedRecipient(null)}
                          className="h-8 w-8 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block ml-1 mb-2">
                      Payment Type
                    </label>
                    <Select value={paymentType} onValueChange={setPaymentType}>
                      <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-[#E87154]">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COMPETITION_PRIZE">Competition Prize</SelectItem>
                        <SelectItem value="BONUS">Bonus</SelectItem>
                        <SelectItem value="INCENTIVE">Incentive</SelectItem>
                        <SelectItem value="CORRECTION">Correction</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block ml-1 mb-2">
                      Total Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-sm font-bold text-slate-400">GHS</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        className="pl-12 h-11 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus-visible:ring-[#E87154] font-bold text-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block ml-1 mb-2">
                      Payment Method
                    </label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-[#E87154]">
                        <SelectValue placeholder="Select method (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MOMO">Mobile Money (MOMO)</SelectItem>
                        <SelectItem value="BANK">Bank Transfer</SelectItem>
                        <SelectItem value="CASH">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block ml-1 mb-2">
                      Payment Reference
                    </label>
                    <Input
                      placeholder="Transaction ID / reference (optional)"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className="h-11 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus-visible:ring-[#E87154]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block ml-1 mb-2">
                    Reason / Description
                  </label>
                  <Textarea
                    placeholder="Enter reason for payment (e.g. signup competition winner)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus-visible:ring-[#E87154] min-h-[100px]"
                  />
                </div>
              </div>
            </Card>

            {/* Allocation section */}
            {selectedRecipient && (
              <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Allocate Against Outstanding Balance</h3>
                    <p className="text-xs text-slate-500 mt-1">Select outstanding commissions to offset with this manual payment</p>
                  </div>

                  {loadingCommissions ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-[#E87154]" />
                    </div>
                  ) : commissions.length === 0 ? (
                    <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 rounded-xl">
                      <Info className="h-5 w-5 flex-shrink-0" />
                      <div className="text-sm">
                        No outstanding commissions found for this recipient. The full amount (GHS {numTotalAmount.toFixed(2)}) will be recorded as a bonus payout.
                      </div>
                    </div>
                  ) : (
                    <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                          <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                            <TableHead className="w-12 text-center py-3">
                              <input
                                type="checkbox"
                                checked={selectedCommissionIds.length === commissions.length}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-[#E87154] focus:ring-[#E87154]"
                              />
                            </TableHead>
                            <TableHead className="font-bold text-slate-500 text-xs">Source Type</TableHead>
                            <TableHead className="font-bold text-slate-500 text-xs">Commission Date</TableHead>
                            <TableHead className="font-bold text-slate-500 text-xs text-right pr-6">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {commissions.map((comm) => {
                            const date = new Date(comm.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            });
                            const isChecked = selectedCommissionIds.includes(comm.id);

                            return (
                              <TableRow
                                key={comm.id}
                                className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                              >
                                <TableCell className="text-center py-3">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => handleSelectCommission(comm.id, e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-[#E87154] focus:ring-[#E87154]"
                                  />
                                </TableCell>
                                <TableCell>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {SOURCE_LABELS[comm.sourceType] || comm.sourceType}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    Ref ID: {comm.sourceId || "—"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-slate-500 text-sm">{date}</TableCell>
                                <TableCell className="text-right font-bold text-slate-900 dark:text-white pr-6">
                                  GHS {comm.amount.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Allocation summary sidebar */}
          <div className="space-y-6">
            <Card className="border-l-4 border-l-[#E87154] shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
              <div className="p-6 space-y-6">
                <h3 className="text-md font-black uppercase tracking-[0.1em] text-slate-400">
                  Payment Summary
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-slate-500">Total Payment</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      GHS {numTotalAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-slate-500">Applied to Commissions</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      GHS {numAllocated.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm pb-2">
                    <span className="text-slate-500">Remaining Bonus</span>
                    <span className="font-black text-[#E87154] text-lg">
                      GHS {numBonus.toFixed(2)}
                    </span>
                  </div>
                </div>

                {isAllocationOverLimit && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl">
                    Error: The allocated commission amount exceeds the total payment amount. Please increase the total payment or deselect some commissions.
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    !selectedRecipient ||
                    !paymentType ||
                    numTotalAmount <= 0 ||
                    isAllocationOverLimit ||
                    isSubmitting
                  }
                  className="w-full bg-[#E87154] hover:bg-[#D4654A] text-white font-bold h-12 rounded-xl shadow-sm gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Manual Payment"
                  )}
                </Button>
              </div>
            </Card>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-xs text-slate-400 leading-relaxed">
              <strong>Note:</strong> Creating this manual payment will mark the selected commissions as <strong>PAID</strong>, taking them out of the weekly automatic payout generation process. This prevents double payouts.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
