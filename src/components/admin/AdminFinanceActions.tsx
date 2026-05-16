"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { approveCommission, approvePayoutRequest } from "@/app/actions/admin";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, CheckCircle, Eye, Wallet, User as UserIcon, CreditCard, Clock, CheckCircle2, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AdminCommissionActions({ id, status, onSuccess }: { id: string, status: string, onSuccess?: () => void }) {
    const [loading, setLoading] = useState(false);

    if (status !== "PENDING") return null;

    const handleApprove = async () => {
        setLoading(true);
        const res = await approveCommission(id);
        setLoading(false);
        if (res.success) {
            toast.success("Commission approved");
            onSuccess?.();
        } else {
            toast.error(res.error || "Failed to approve");
        }
    };

    return (
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleApprove} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 text-green-600" />}
        </Button>
    );
}

interface PayoutRequest {
    id: string;
    status: string;
    amount: number;
    requestedAt: Date;
    processedAt?: Date | null;
    paymentMethod?: string | null;
    user: {
        email: string;
        firstName?: string | null;
        lastName?: string | null;
        role: string;
    };
}

export function AdminPayoutActions({ payout, onSuccess }: { payout: PayoutRequest, onSuccess?: () => void }) {
    const [loading, setLoading] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);

    const handleApprove = async () => {
        setLoading(true);
        const res = await approvePayoutRequest(payout.id);
        setLoading(false);
        if (res.success) {
            toast.success("Payout marked as paid");
            onSuccess?.();
        } else {
            toast.error(res.error || "Failed to process");
        }
    };

    let paymentMethodData: any = null;
    try {
        if (payout.paymentMethod) {
            paymentMethodData = JSON.parse(payout.paymentMethod);
        }
    } catch (e) {
        console.error("Failed to parse payment method:", e);
    }

    return (
        <div className="flex gap-2">
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-[#E87154]/10 hover:text-[#E87154] transition-colors">
                        <Eye className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-none shadow-2xl p-0 rounded-2xl">
                    <div className="bg-[#FFFAF5] p-6 border-b border-stone-100 relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12">
                            <Wallet size={100} className="text-stone-900" />
                        </div>
                        <DialogHeader>
                            <div className="flex items-center gap-2 mb-1">
                                <Clock size={14} className="text-[#E87154]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Withdrawal Review</span>
                            </div>
                            <DialogTitle className="text-2xl font-black text-slate-900">Payout Details</DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium mt-2">
                                Verification of ambassador funds and payment destination
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-6 bg-white dark:bg-slate-900">
                        <div className="grid gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#E87154]">
                                        <UserIcon size={14} />
                                    </div>
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Recipient Information</h4>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2 border-none">
                                    <p className="text-sm font-black text-slate-900 dark:text-white">
                                        {payout.user.firstName ? `${payout.user.firstName} ${payout.user.lastName}` : payout.user.email}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs text-slate-500 font-medium">{payout.user.email}</p>
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-white dark:bg-slate-900 border-none shadow-sm h-4">
                                            {payout.user.role}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-500">
                                        <DollarSign size={14} />
                                    </div>
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Financial Data</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border-none">
                                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Amount</p>
                                        <p className="text-xl font-black text-emerald-600">GHS {Number(payout.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border-none">
                                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Status</p>
                                        <Badge
                                            variant={payout.status === "PAID" ? "default" : payout.status === "APPROVED" ? "secondary" : "outline"}
                                            className={cn(
                                                "text-[10px] font-black uppercase tracking-widest border-none shadow-sm",
                                                payout.status === "PAID" && "bg-emerald-500 text-white",
                                                payout.status === "APPROVED" && "bg-blue-500 text-white",
                                                payout.status === "PENDING" && "bg-amber-500 text-white"
                                            )}
                                        >
                                            {payout.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {paymentMethodData && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-500">
                                            <CreditCard size={14} />
                                        </div>
                                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Payment Destination</h4>
                                    </div>
                                    <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-4 text-white shadow-lg space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Method</span>
                                            <span className="text-xs font-bold uppercase italic text-[#E87154]">
                                                {paymentMethodData.type === "momo" ? "Mobile Money" : "Bank Transfer"}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Account Details</span>
                                            <div className="font-mono text-xs bg-white/5 p-3 rounded-lg border border-white/5 text-slate-300 break-all leading-relaxed">
                                                {paymentMethodData.details}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {payout.status === "PENDING" && (
                            <div className="pt-4 mt-2">
                                <Button 
                                    className="w-full h-12 rounded-xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-lg shadow-[#E87154]/20 transition-all active:scale-95 text-white gap-2" 
                                    onClick={handleApprove} 
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <CheckCircle2 size={18} />
                                    )}
                                    Authorize Payment
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {payout.status === "PENDING" && (
                <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full px-4 text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20" onClick={handleApprove} disabled={loading}>
                    {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
                    Pay Now
                </Button>
            )}
        </div>
    );
}
