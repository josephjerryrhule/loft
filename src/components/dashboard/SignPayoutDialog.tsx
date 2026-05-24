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
import { signPayoutSlip } from "@/app/actions/payout";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, FileText, CheckCircle, ShieldAlert } from "lucide-react";
import { getCurrencySymbol } from "@/lib/utils";

interface SignPayoutDialogProps {
  payout: {
    id: string;
    weekStart: string;
    weekEnd: string;
    amountGHS: number;
    amountUSD: number;
    approvedAt: string | null;
    approvedBy: string | null;
  };
  userName: string;
  onSuccess: () => void;
}

export function SignPayoutDialog({ payout, userName, onSuccess }: SignPayoutDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [typedName, setTypedName] = useState("");

  const startDateStr = new Date(payout.weekStart).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const endDateStr = new Date(payout.weekEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const approvedDateStr = payout.approvedAt ? new Date(payout.approvedAt).toLocaleString() : "N/A";

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledged) {
      toast.error("Please check the acknowledgement checkbox.");
      return;
    }
    if (!typedName.trim()) {
      toast.error("Please type your full name to sign.");
      return;
    }

    setLoading(true);
    try {
      // Get IP client side via simple public api fallback (optional, otherwise empty)
      let ip = "127.0.0.1";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        ip = ipData.ip || ip;
      } catch (err) {
        console.warn("Could not retrieve client IP, falling back.");
      }

      const res = await signPayoutSlip(payout.id, typedName, ip);
      if (res.success) {
        toast.success("Payment slip signed successfully!");
        setOpen(false);
        onSuccess();
      } else {
        toast.error(res.error || "Failed to sign payment slip.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-[#E87154] hover:bg-[#D66144] shadow-lg shadow-[#E87154]/20 gap-2 h-9 px-4 rounded-xl font-bold text-white text-xs transition-all active:scale-95"
        >
          <FileText size={14} /> Sign Slip
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto border-none shadow-2xl p-0 rounded-[2rem] bg-white">
        <div className="bg-[#FFFAF5] p-8 border-b border-stone-100 relative">
          <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12">
            <FileText size={100} className="text-stone-900" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 leading-none">Acknowledge Payment Slip</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium mt-2 text-sm italic">
              Verify your approved weekly statement and sign before funds are transferred.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSign} className="p-8 space-y-6 bg-white">
          <div className="space-y-4 border border-stone-100 rounded-2xl p-5 bg-stone-50/50">
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
              <div>
                <span className="block text-[10px] uppercase font-black tracking-wider text-stone-400">Statement ID</span>
                <span className="text-slate-900 text-xs font-mono">{payout.id}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-black tracking-wider text-stone-400">Recipient Name</span>
                <span className="text-slate-900">{userName}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-black tracking-wider text-stone-400">Commission Period</span>
                <span className="text-slate-900">{startDateStr} - {endDateStr}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-black tracking-wider text-stone-400">Approved Timestamp</span>
                <span className="text-slate-900">{approvedDateStr}</span>
              </div>
            </div>

            <div className="border-t border-stone-200/60 pt-4 flex justify-between items-center">
              <span className="text-xs uppercase font-black tracking-widest text-[#E87154]">Total Matured Amount</span>
              <div className="text-right">
                {payout.amountGHS > 0 && (
                  <div className="text-lg font-black text-slate-900">₵{payout.amountGHS.toFixed(2)}</div>
                )}
                {payout.amountUSD > 0 && (
                  <div className="text-lg font-black text-slate-900">${payout.amountUSD.toFixed(2)}</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-orange-50/40 rounded-xl border border-orange-100/50">
            <input 
              id="acknowledge" 
              type="checkbox"
              checked={acknowledged} 
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-stone-300 text-[#E87154] focus:ring-[#E87154] cursor-pointer"
            />
            <div className="space-y-1">
              <label 
                htmlFor="acknowledge" 
                className="text-xs font-bold text-slate-700 leading-normal cursor-pointer select-none"
              >
                I acknowledge this approved commission payment and confirm payment will be made to my registered payment account.
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="typedName" className="text-[10px] font-black uppercase tracking-wider text-slate-500">Typed Digital Signature</Label>
            <Input 
              id="typedName" 
              type="text" 
              value={typedName} 
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Type your full name to authorize" 
              required
              className="h-11 bg-slate-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="rounded-xl font-bold h-11"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !acknowledged || !typedName.trim()}
              className="rounded-xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-lg shadow-[#E87154]/10 h-11 text-white flex-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle size={16} className="mr-2" />
              )}
              Confirm Signature
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
