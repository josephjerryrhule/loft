"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Loader2, Save, Settings2, Clock, Percent, ShieldCheck, Zap } from "lucide-react";
import { updatePlan } from "@/app/actions/plans";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface EditPlanDialogProps {
  plan: {
    id: string;
    name: string;
    description: string | null;
    price: number | string;
    durationDays: number;
    features: string | null;
    affiliateCommissionPercentage?: number | string | null;
    isActive: boolean;
  };
  onSuccess?: () => void;
}

export function EditPlanDialog({ plan, onSuccess }: EditPlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(plan.isActive ? "active" : "inactive");
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const result = await updatePlan(plan.id, formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Plan updated successfully");
        setOpen(false);
        router.refresh();
        onSuccess?.();
      }
    } catch {
      toast.error("Failed to update plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-blue-50:bg-blue-900/20 hover:text-blue-600 transition-all">
          <Pencil className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[50rem] w-[95vw] border-none shadow-2xl p-0 rounded-2xl sm:rounded-[2.5rem] overflow-hidden">
        <div className="bg-[#FFFAF5] p-6 sm:p-10 border-b border-stone-100 relative">
            <div className="absolute top-0 right-0 p-6 sm:p-10 opacity-5 rotate-12">
                <Settings2 size={140} className="w-24 h-24 sm:w-36 sm:h-36" />
            </div>
            <DialogHeader className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-6 w-6 rounded-lg bg-[#E87154]/10 flex items-center justify-center">
                        <Zap size={12} className="text-[#E87154]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Plan Settings</span>
                </div>
                <DialogTitle className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">Update Membership Plan</DialogTitle>
                <DialogDescription className="text-slate-500 font-medium mt-3 text-sm sm:text-base italic">
                    Changing the <span className="text-[#E87154] font-black tracking-tight">{plan.name}</span> plan will affect all new signups.
                </DialogDescription>
            </DialogHeader>
        </div>
        
        <form action={handleSubmit} className="p-6 sm:p-10 space-y-6 sm:space-y-8 bg-white overflow-x-hidden">
          <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="edit-name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Plan Name</Label>
              <Input 
                id="edit-name" 
                name="name" 
                defaultValue={plan.name}
                placeholder="e.g. Master Class" 
                required 
                className="h-11 sm:h-12 bg-stone-50 border-stone-100 rounded-xl font-bold focus-visible:ring-[#E87154] shadow-sm px-4"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="edit-duration" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Duration (Days)</Label>
              <div className="relative">
                <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                <Input 
                  id="edit-duration" 
                  name="durationDays" 
                  type="number" 
                  defaultValue={plan.durationDays}
                  placeholder="30" 
                  required 
                  className="pl-12 h-11 sm:h-12 bg-stone-50 border-stone-100 rounded-xl font-black focus-visible:ring-[#E87154] shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="edit-description" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Description</Label>
            <Textarea 
              id="edit-description" 
              name="description" 
              defaultValue={plan.description || ""}
              placeholder="What do members get with this plan?..." 
              className="min-h-[80px] bg-stone-50 border-stone-100 rounded-2xl font-medium focus-visible:ring-[#E87154] shadow-sm p-4"
            />
          </div>

          <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="edit-price" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Price (GHS)</Label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-stone-300 text-lg tracking-tighter">GHS</span>
                <Input 
                  id="edit-price" 
                  name="price" 
                  type="number" 
                  step="0.01" 
                  defaultValue={Number(plan.price).toFixed(2)}
                  placeholder="49.99" 
                  required 
                  className="pl-16 h-14 bg-stone-50 border-stone-100 rounded-2xl font-black text-xl focus-visible:ring-[#E87154] shadow-sm"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="edit-affiliate" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Affiliate Commission (%)</Label>
              <div className="relative">
                <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                <Input 
                  id="edit-affiliate" 
                  name="affiliateCommissionPercentage" 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  max="100" 
                  defaultValue={plan.affiliateCommissionPercentage ? Number(plan.affiliateCommissionPercentage).toFixed(2) : ""}
                  placeholder="Standard Rate" 
                  className="pl-12 h-14 bg-stone-50 border-stone-100 rounded-2xl font-black text-xl text-emerald-600 focus-visible:ring-[#E87154] shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="edit-features" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">List of Features</Label>
            <Textarea 
              id="edit-features" 
              name="features" 
              defaultValue={plan.features || ""}
              placeholder="List the benefits (one per line)..." 
              className="min-h-[120px] bg-stone-50 border-stone-100 rounded-2xl font-medium focus-visible:ring-[#E87154] shadow-sm p-5 leading-relaxed"
            />
          </div>

          <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 pt-2">
            <div className="space-y-3">
                <Label htmlFor="edit-status" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Status</Label>
                <Select 
                value={status} 
                onValueChange={setStatus}
                >
                <SelectTrigger id="edit-status" className="h-12 bg-stone-50 border-stone-100 rounded-xl font-black focus:ring-[#E87154] shadow-sm px-4">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                    <SelectItem value="active" className="font-bold py-3 rounded-xl text-emerald-600 text-sm">Public / Live</SelectItem>
                    <SelectItem value="inactive" className="font-bold py-3 rounded-xl text-stone-500 text-sm">Hidden / Draft</SelectItem>
                </SelectContent>
                </Select>
                <input type="hidden" name="isActive" value={status === "active" ? "true" : "false"} />
            </div>
          </div>

          <DialogFooter className="pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Button 
                    type="button" 
                    variant="ghost"
                    className="flex-1 h-14 rounded-2xl text-stone-400 font-bold hover:text-slate-900 hover:bg-stone-50 transition-all text-base"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button 
                    type="submit" 
                    className="flex-[2] h-14 rounded-2xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-lg shadow-[#E87154]/20 transition-all active:scale-95 text-white text-base gap-3"
                    disabled={loading}
                >
                    {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <ShieldCheck className="h-5 w-5" />
                    )}
                    Save Changes
                </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
