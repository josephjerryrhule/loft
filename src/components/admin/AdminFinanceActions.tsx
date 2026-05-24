"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { approveCommission } from "@/app/actions/admin";
import { approvePayoutStatement, markPayoutAsPaid, unapprovePayoutStatement, unpayPayoutStatement } from "@/app/actions/payout";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, CheckCircle, Eye, Wallet, User as UserIcon, CreditCard, Clock, CheckCircle2, DollarSign, AlertCircle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatRole } from "@/lib/format-utils";

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

interface Payout {
    id: string;
    status: string;
    weekStart: string;
    weekEnd: string;
    amountGHS: number;
    amountUSD: number;
    approvedAt: string | null;
    approvedBy: string | null;
    signedAt: string | null;
    signatureName: string | null;
    signatureIp: string | null;
    paidAt: string | null;
    paymentMethod: string | null;
    paymentRef: string | null;
    recipientAcc: string | null;
    proofUrl: string | null;
    user: {
        email: string;
        firstName?: string | null;
        lastName?: string | null;
        role: string;
        payoutMethodType?: string | null;
        payoutDetails?: string | null;
    };
}

export function AdminPayoutActions({ payout, onSuccess }: { payout: Payout, onSuccess?: () => void }) {
    const [loading, setLoading] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [proofUrl, setProofUrl] = useState("");

    const handleApprove = async () => {
        setLoading(true);
        const res = await approvePayoutStatement(payout.id);
        setLoading(false);
        if (res.success) {
            toast.success("Payout statement approved! Awaiting user signature.");
            setViewOpen(false);
            onSuccess?.();
        } else {
            toast.error(res.error || "Failed to approve statement");
        }
    };

    const handleUnapprove = async () => {
        if (!confirm("Are you sure you want to unapprove this statement? This will revert it to PAYABLE status, clear signatures, and reset all linked commissions back to PENDING.")) return;
        setLoading(true);
        const res = await unapprovePayoutStatement(payout.id);
        setLoading(false);
        if (res.success) {
            toast.success("Payout statement unapproved and reverted successfully!");
            setViewOpen(false);
            onSuccess?.();
        } else {
            toast.error(res.error || "Failed to unapprove statement");
        }
    };

    const handleUnpay = async () => {
        if (!confirm("Are you sure you want to unpay this statement? This will delete the uploaded payment proof screenshot, clear payment reference details, revert payout status to SIGNED, and reset all commissions back to APPROVED.")) return;
        setLoading(true);
        const res = await unpayPayoutStatement(payout.id);
        setLoading(false);
        if (res.success) {
            toast.success("Payout statement unpaid successfully!");
            setViewOpen(false);
            onSuccess?.();
        } else {
            toast.error(res.error || "Failed to unpay statement");
        }
    };

    const handleMarkAsPaidSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        const paymentMethod = formData.get("paymentMethod") as string;
        const paymentRef = formData.get("paymentRef") as string;
        const amountPaid = parseFloat(formData.get("amountPaid") as string);
        const recipientAcc = formData.get("recipientAcc") as string;
        const paidAtStr = formData.get("paidAtStr") as string;
        const finalProofUrl = formData.get("proofUrl") as string || proofUrl;

        if (!paymentRef.trim()) {
            toast.error("Transaction reference is required.");
            return;
        }
        if (!finalProofUrl) {
            toast.error("Please upload payment proof screenshot.");
            return;
        }

        setLoading(true);
        const res = await markPayoutAsPaid(payout.id, {
            paymentMethod,
            paymentRef,
            amountPaid,
            recipientAcc,
            proofUrl: finalProofUrl,
            paidAtStr
        });
        setLoading(false);

        if (res.success) {
            toast.success("Payout marked as paid successfully!");
            setViewOpen(false);
            onSuccess?.();
        } else if (res.reviewNeeded) {
            toast.warning(res.error || "Payment details mismatched. Marked for review.");
            setViewOpen(false);
            onSuccess?.();
        } else {
            toast.error(res.error || "Failed to complete payout");
        }
    };

    const startDateStr = new Date(payout.weekStart).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const endDateStr = new Date(payout.weekEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

    const totalAmount = payout.amountGHS > 0 ? payout.amountGHS : payout.amountUSD;
    const currencyLabel = payout.amountGHS > 0 ? "GHS" : "USD";

    return (
        <div className="flex gap-2 justify-end">
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-[#E87154]/10 hover:text-[#E87154] transition-colors">
                        <Eye className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-none shadow-2xl p-0 rounded-2xl bg-white">
                    <div className="bg-[#FFFAF5] p-6 border-b border-stone-100 relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12">
                            <Wallet size={100} className="text-stone-900" />
                        </div>
                        <DialogHeader>
                            <div className="flex items-center gap-2 mb-1">
                                <Clock size={14} className="text-[#E87154]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Payout Review</span>
                            </div>
                            <DialogTitle className="text-2xl font-black text-slate-900">
                                Week: {startDateStr} - {endDateStr}
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium mt-2">
                                Review statement verification and payment details
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-6 bg-white">
                        <div className="grid gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#E87154]">
                                        <UserIcon size={14} />
                                    </div>
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Recipient Info</h4>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 space-y-2 border-none">
                                    <p className="text-sm font-black text-slate-900">
                                        {payout.user.firstName ? `${payout.user.firstName} ${payout.user.lastName}` : payout.user.email}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs text-slate-500 font-medium">{payout.user.email}</p>
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-white border-none shadow-sm h-4">
                                            {formatRole(payout.user.role)}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Statement Value</h4>
                                    <div className="bg-slate-50 rounded-xl p-4 border-none">
                                        {payout.amountGHS > 0 && (
                                            <p className="text-xl font-black text-emerald-600">₵{payout.amountGHS.toFixed(2)}</p>
                                        )}
                                        {payout.amountUSD > 0 && (
                                            <p className="text-xl font-black text-emerald-600">${payout.amountUSD.toFixed(2)}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Statement Status</h4>
                                    <div className="bg-slate-50 rounded-xl p-4 border-none flex items-center">
                                        <Badge
                                            className={cn(
                                                "text-[10px] font-black uppercase tracking-widest border-none shadow-sm h-6 px-3",
                                                payout.status === "PAID" && "bg-emerald-500 text-white",
                                                payout.status === "SIGNED" && "bg-purple-500 text-white",
                                                payout.status === "APPROVED" && "bg-blue-500 text-white",
                                                payout.status === "REVIEW_NEEDED" && "bg-red-500 text-white animate-pulse",
                                                payout.status === "PAYABLE" && "bg-amber-500 text-white"
                                            )}
                                        >
                                            {payout.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Payout configuration saved in user settings */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-indigo-500">
                                        <CreditCard size={14} />
                                    </div>
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">User Registered Payout Settings</h4>
                                </div>
                                <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400 font-bold">Method:</span>
                                        <span className="font-mono uppercase">{payout.user.payoutMethodType || "None"}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400 font-bold">Account details:</span>
                                        <span className="font-mono text-slate-300">{payout.user.payoutDetails || "None configured"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Digital signature information */}
                            {(payout.status === "SIGNED" || payout.status === "PAID" || payout.status === "REVIEW_NEEDED") && payout.signedAt && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-purple-500">
                                            <FileText size={14} />
                                        </div>
                                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Digital Signature Slip</h4>
                                    </div>
                                    <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 space-y-1.5 text-xs text-slate-600">
                                        <p><strong>Signed by:</strong> {payout.signatureName}</p>
                                        <p><strong>Timestamp:</strong> {new Date(payout.signedAt).toLocaleString()}</p>
                                        <p><strong>Signee IP:</strong> {payout.signatureIp}</p>
                                        <p className="italic text-[10px] text-purple-700/80 bg-white border border-purple-100/50 p-2.5 rounded-lg mt-2 font-medium">
                                            "I acknowledge this approved commission payment and confirm payment will be made to my registered payment account."
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Already Paid metadata */}
                            {payout.status === "PAID" && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-emerald-500">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Payment Evidence</h4>
                                    </div>
                                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 text-xs space-y-1.5">
                                        <p><strong>Reference:</strong> {payout.paymentRef}</p>
                                        <p><strong>Account Paid:</strong> {payout.recipientAcc}</p>
                                        <p><strong>Paid timestamp:</strong> {payout.paidAt ? new Date(payout.paidAt).toLocaleString() : "N/A"}</p>
                                        {payout.proofUrl && (
                                            <a 
                                                href={payout.proofUrl} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-bold gap-1 mt-2 underline"
                                            >
                                                View Uploaded Screenshot Proof
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions mapping */}
                        {payout.status === "PAYABLE" && (
                            <div className="pt-4 border-t border-stone-100">
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
                                    Approve Statement & Lock Period
                                </Button>
                            </div>
                        )}

                        {/* Sign -> Paid manually uploaded details */}
                        {(payout.status === "SIGNED" || payout.status === "REVIEW_NEEDED") && (
                            <form onSubmit={handleMarkAsPaidSubmit} className="space-y-4 pt-4 border-t border-stone-100 text-left">
                                <h4 className="text-sm font-black uppercase tracking-wider text-stone-900 mb-2">Submit Payment Receipt Details</h4>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="paymentMethod" className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Method</Label>
                                        <Select name="paymentMethod" defaultValue={payout.user.payoutMethodType || "momo"}>
                                            <SelectTrigger className="h-10 bg-slate-50 border-none rounded-lg font-semibold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border shadow-md rounded-lg">
                                                <SelectItem value="momo">Mobile Money</SelectItem>
                                                <SelectItem value="bank">Bank Transfer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="recipientAcc" className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Recipient Account / Wallet</Label>
                                        <Input 
                                            id="recipientAcc" 
                                            name="recipientAcc" 
                                            defaultValue={payout.user.payoutDetails || ""} 
                                            placeholder="Enter recipient number/details" 
                                            required
                                            className="h-10 bg-slate-50 border-none rounded-lg font-semibold"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="amountPaid" className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Amount Paid ({currencyLabel})</Label>
                                        <Input 
                                            id="amountPaid" 
                                            name="amountPaid" 
                                            type="number"
                                            step="0.01"
                                            defaultValue={totalAmount.toFixed(2)} 
                                            required
                                            className="h-10 bg-slate-50 border-none rounded-lg font-black"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="paidAtStr" className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Payment Timestamp</Label>
                                        <Input 
                                            id="paidAtStr" 
                                            name="paidAtStr" 
                                            type="datetime-local" 
                                            defaultValue={new Date().toISOString().slice(0, 16)} 
                                            required
                                            className="h-10 bg-slate-50 border-none rounded-lg font-semibold text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="paymentRef" className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Transaction Reference ID</Label>
                                    <Input 
                                        id="paymentRef" 
                                        name="paymentRef" 
                                        placeholder="e.g. MoMo Transaction ID or Bank Ref" 
                                        required
                                        className="h-10 bg-slate-50 border-none rounded-lg font-semibold"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <FileUpload 
                                        label="Screenshot Proof of Payment" 
                                        name="proofUrl" 
                                        accept="image/*,application/pdf"
                                        required
                                        onUpload={(url) => setProofUrl(url)}
                                        folder="payout-proofs"
                                    />
                                </div>

                                <div className="pt-2">
                                    <Button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-500/10 gap-2"
                                    >
                                        {loading ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <CheckCircle2 size={16} />
                                        )}
                                        Mark as Paid & Lock Payout
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* Unapprove option for APPROVED, SIGNED, REVIEW_NEEDED status */}
                        {["APPROVED", "SIGNED", "REVIEW_NEEDED"].includes(payout.status) && (
                            <div className="pt-4 border-t border-stone-100">
                                <Button 
                                    variant="outline"
                                    type="button"
                                    className="w-full h-12 rounded-xl border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 font-bold transition-all active:scale-95 gap-2" 
                                    onClick={handleUnapprove} 
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <AlertCircle size={18} />
                                    )}
                                    Unapprove & Revert Statement
                                </Button>
                            </div>
                        )}

                        {/* Unpay option for PAID status */}
                        {payout.status === "PAID" && (
                            <div className="pt-4 border-t border-stone-100">
                                <Button 
                                    variant="outline"
                                    type="button"
                                    className="w-full h-12 rounded-xl border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 font-bold transition-all active:scale-95 gap-2" 
                                    onClick={handleUnpay} 
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <AlertCircle size={18} />
                                    )}
                                    Unpay Statement (Delete Receipt)
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {payout.status === "PAYABLE" && (
                <Button 
                    size="sm" 
                    className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full px-4 text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20" 
                    onClick={handleApprove} 
                    disabled={loading}
                >
                    {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
                    Approve
                </Button>
            )}

            {(payout.status === "SIGNED" || payout.status === "REVIEW_NEEDED") && (
                <Button 
                    size="sm" 
                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full px-4 text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20" 
                    onClick={() => setViewOpen(true)}
                >
                    <Wallet className="mr-1 h-3 w-3" />
                    Pay Slip
                </Button>
            )}
        </div>
    );
}
