"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPayout } from "@/app/actions/payout";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, Wallet, Info, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface RequestPayoutDialogProps {
    availableBalance: number;
    minimumPayoutAmount?: number;
}

export function RequestPayoutDialog({ availableBalance, minimumPayoutAmount = 50 }: RequestPayoutDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const canRequestPayout = availableBalance > 0 && availableBalance >= minimumPayoutAmount;

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        const amount = parseFloat(formData.get("amount") as string);
        const methodType = formData.get("methodType") as string;
        const details = formData.get("details") as string;

        if (amount > availableBalance) {
            toast.error("Amount exceeds available balance");
            setLoading(false);
            return;
        }

        const method = { type: methodType, details };

        const res = await requestPayout(amount, method);
        setLoading(false);

        if (res.success) {
            toast.success("Payout requested successfully");
            setOpen(false);
        } else {
            toast.error(res.error || "Failed to request payout");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button 
                    disabled={!canRequestPayout}
                    className="bg-[#E87154] hover:bg-[#D66144] shadow-lg shadow-[#E87154]/20 gap-3 h-12 px-8 rounded-2xl font-black text-white transition-all active:scale-95"
                >
                    <Wallet size={20} /> Request Payout
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-none shadow-2xl p-0 rounded-[2.5rem]">
                <div className="bg-[#E87154] p-10 text-white relative">
                    <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
                        <Wallet size={140} />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-white leading-none">Withdraw Funds</DialogTitle>
                        <DialogDescription className="text-white/80 font-medium mt-3 text-base">
                            Transfer your earned commissions to your bank or mobile money account
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="mt-8 bg-white/10 rounded-[2rem] p-6 backdrop-blur-md border border-white/20 shadow-inner">
                        <p className="text-[10px] uppercase font-black tracking-[0.3em] text-white/60 mb-2">Available Balance</p>
                        <p className="text-4xl font-black text-white">GHS {availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>

                <form action={handleSubmit} className="p-10 space-y-8 bg-white dark:bg-slate-900">
                        <div className="flex items-start gap-4 p-5 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm animate-in pulse duration-1000">
                            <Info size={20} className="shrink-0 mt-0.5" />
                            <p className="font-bold leading-relaxed text-sm">Minimum payout amount is GHS {minimumPayoutAmount.toFixed(2)}. You need GHS {(minimumPayoutAmount - availableBalance).toFixed(2)} more to request a payout.</p>
                        </div>

                    <div className="space-y-3">
                        <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Amount to Withdraw</Label>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300 text-lg">GHS</span>
                            <Input 
                                id="amount" 
                                name="amount" 
                                type="number" 
                                max={availableBalance} 
                                min={1} 
                                step="0.01" 
                                required 
                                defaultValue={availableBalance}
                                className="pl-16 h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-black text-xl focus-visible:ring-[#E87154] shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="grid gap-8 md:grid-cols-1">
                        <div className="space-y-3">
                             <Label htmlFor="methodType" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Payment Method</Label>
                             <Select name="methodType" defaultValue="momo">
                                <SelectTrigger className="h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold focus:ring-[#E87154] shadow-inner px-5">
                                    <SelectValue placeholder="Select Method" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                                    <SelectItem value="momo" className="font-bold py-3 rounded-xl">Mobile Money (MTN/AirtelTigo/Telecel)</SelectItem>
                                    <SelectItem value="bank" className="font-bold py-3 rounded-xl">Local Bank Transfer</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="details" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Account Details</Label>
                            <Textarea 
                                id="details" 
                                name="details" 
                                placeholder="e.g. 0541234567 (MTN), or Bank Name & Account Number" 
                                required 
                                className="min-h-[120px] bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-medium focus-visible:ring-[#E87154] p-5 shadow-inner leading-relaxed"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button 
                            type="submit" 
                            disabled={loading || !canRequestPayout}
                            className="w-full h-14 rounded-2xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-xl shadow-[#E87154]/20 transition-all active:scale-95 text-white text-base"
                        >
                            {loading ? (
                                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                            ) : (
                                <CheckCircle2 className="mr-3 h-6 w-6" />
                            )}
                            Confirm Withdrawal
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
