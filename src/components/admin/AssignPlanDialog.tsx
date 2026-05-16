"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Crown, User, Baby, CheckCircle2, ChevronRight, Hash, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { adminAssignPlan, getAdminUserChildren } from "@/app/actions/admin";
import { getPlans } from "@/app/actions/plans";

interface AssignPlanDialogProps {
    user: {
        id: string;
        email: string;
        firstName?: string | null;
        lastName?: string | null;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AssignPlanDialog({ user, open, onOpenChange }: AssignPlanDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [plans, setPlans] = useState<any[]>([]);
    const [children, setChildren] = useState<any[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState("");
    const [selectedProfileId, setSelectedProfileId] = useState(""); // "" = parent
    const [customDuration, setCustomDuration] = useState("");
    const [reason, setReason] = useState("");

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    async function loadData() {
        try {
            setDataLoading(true);
            const [plansData, childrenData] = await Promise.all([
                getPlans(),
                getAdminUserChildren(user.id),
            ]);
            setPlans(plansData);
            setChildren(childrenData);
            if (plansData.length > 0) {
                setSelectedPlanId(plansData[0].id);
            }
            setSelectedProfileId("");
            setCustomDuration("");
            setReason("");
        } catch (error) {
            console.error("Failed to load data:", error);
            toast.error("Failed to load plans and profiles");
        } finally {
            setDataLoading(false);
        }
    }

    const selectedPlan = plans.find((p) => p.id === selectedPlanId);
    const displayDuration = customDuration ? parseInt(customDuration) : selectedPlan?.durationDays;

    async function handleSubmit() {
        if (!selectedPlanId) {
            toast.error("Please select a plan");
            return;
        }

        setLoading(true);
        try {
            const result = await adminAssignPlan({
                userId: user.id,
                planId: selectedPlanId,
                childProfileId: selectedProfileId || null,
                durationDays: customDuration ? parseInt(customDuration) : undefined,
                reason: reason || undefined,
            });

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(
                    `Plan assigned to ${selectedProfileId ? "child profile" : user.email} successfully!`
                );
                onOpenChange(false);
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to assign plan");
        } finally {
            setLoading(false);
        }
    }

    const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[50rem] w-[95vw] max-h-[95vh] overflow-y-auto border-none shadow-2xl p-0 rounded-2xl sm:rounded-[2rem] overflow-x-hidden">
                <div className="bg-[#FFFAF5] p-6 sm:p-10 border-b border-stone-100 relative">
                    <div className="absolute top-0 right-0 p-6 sm:p-10 opacity-5 rotate-12">
                        <Crown className="w-24 h-24 sm:w-36 sm:h-36 text-stone-900" />
                    </div>
                    <DialogHeader className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Crown size={14} className="text-[#E87154]" />
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Assign a Plan</span>
                        </div>
                        <DialogTitle className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">Assign Plan</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium mt-3 italic text-sm sm:text-base">
                            Give {userName} access to a plan.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {dataLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white dark:bg-slate-900">
                        <Loader2 className="h-10 w-10 animate-spin text-[#E87154]" />
                        <p className="text-sm font-bold text-slate-500 tracking-wide">Loading plans and profiles...</p>
                    </div>
                ) : (
                    <div className="p-6 sm:p-10 space-y-8 sm:space-y-10 bg-white dark:bg-slate-900 overflow-x-hidden">
                        <div className="grid gap-8 sm:gap-10 md:grid-cols-2">
                            {/* Profile Selection */}
                            <div className="space-y-4 sm:space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#E87154] shadow-sm">
                                        <User size={16} />
                                    </div>
                                    <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Target Profile</h4>
                                </div>
                                <RadioGroup value={selectedProfileId} onValueChange={setSelectedProfileId} className="grid grid-cols-1 gap-3 sm:gap-4">
                                    <div
                                        className={cn(
                                            "flex items-center gap-4 sm:gap-5 rounded-xl sm:rounded-[1.25rem] border-2 p-4 sm:p-5 cursor-pointer transition-all duration-300 group shadow-sm",
                                            selectedProfileId === "" ? "border-[#E87154] bg-[#E87154]/5 ring-4 ring-[#E87154]/5" : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
                                        )}
                                        onClick={() => setSelectedProfileId("")}
                                    >
                                        <RadioGroupItem value="" id="admin-profile-parent" className="sr-only" />
                                        <div className={cn(
                                            "h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-[1rem] flex items-center justify-center transition-colors shadow-inner",
                                            selectedProfileId === "" ? "bg-[#E87154] text-white shadow-[#E87154]/30" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                        )}>
                                            <User className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <Label htmlFor="admin-profile-parent" className="font-black block cursor-pointer text-sm sm:text-base mb-0.5 text-slate-900 dark:text-white">
                                                Parent Account
                                            </Label>
                                            <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">{userName}</span>
                                        </div>
                                        {selectedProfileId === "" && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#E87154]" />}
                                    </div>

                                    {children.length > 0 && (
                                        <div className="space-y-3 sm:space-y-4 mt-2">
                                            <div className="flex items-center gap-3 px-2">
                                                <span className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Child Profiles</span>
                                                <div className="flex-1 h-[1px] bg-slate-100 dark:bg-slate-800" />
                                            </div>
                                            {children.map((child) => (
                                                <div
                                                    key={child.id}
                                                    className={cn(
                                                        "flex items-center gap-4 sm:gap-5 rounded-xl sm:rounded-[1.25rem] border-2 p-4 sm:p-5 cursor-pointer transition-all duration-300 group shadow-sm",
                                                        selectedProfileId === child.id ? "border-[#E87154] bg-[#E87154]/5 ring-4 ring-[#E87154]/5" : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
                                                    )}
                                                    onClick={() => setSelectedProfileId(child.id)}
                                                >
                                                    <RadioGroupItem value={child.id} id={`admin-profile-${child.id}`} className="sr-only" />
                                                    <div
                                                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-[1rem] flex items-center justify-center text-white text-xs sm:text-lg font-black flex-shrink-0 shadow-sm"
                                                        style={{ backgroundColor: child.avatarColor || "#6366f1" }}
                                                    >
                                                        {child.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1">
                                                        <Label
                                                            htmlFor={`admin-profile-${child.id}`}
                                                            className="font-black block cursor-pointer text-sm sm:text-base mb-0.5 text-slate-900 dark:text-white"
                                                        >
                                                            {child.name}
                                                        </Label>
                                                        <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                                            {child.subscriptions?.length > 0
                                                                ? child.subscriptions[0].plan.name
                                                                : "Standard Access"}
                                                        </span>
                                                    </div>
                                                    {selectedProfileId === child.id && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#E87154]" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </RadioGroup>
                            </div>

                            {/* Plan Selection */}
                            <div className="space-y-4 sm:space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-500 shadow-sm">
                                        <Hash size={16} />
                                    </div>
                                    <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Subscription Tier</h4>
                                </div>
                                <RadioGroup value={selectedPlanId} onValueChange={setSelectedPlanId} className="grid grid-cols-1 gap-3 sm:gap-4">
                                    {plans.map((plan) => (
                                        <div
                                            key={plan.id}
                                            className={cn(
                                                "flex items-center gap-4 sm:gap-5 rounded-xl sm:rounded-[1.25rem] border-2 p-4 sm:p-5 cursor-pointer transition-all duration-300 group shadow-sm",
                                                selectedPlanId === plan.id ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 ring-4 ring-blue-500/5" : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
                                            )}
                                            onClick={() => setSelectedPlanId(plan.id)}
                                        >
                                            <RadioGroupItem value={plan.id} id={`admin-plan-${plan.id}`} className="sr-only" />
                                            <div className="flex-1">
                                                <Label htmlFor={`admin-plan-${plan.id}`} className="font-black block cursor-pointer text-sm sm:text-base mb-1 text-slate-900 dark:text-white">
                                                    {plan.name}
                                                </Label>
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <span className="text-xs sm:text-sm font-black text-blue-600">GHS {Number(plan.price).toFixed(2)}</span>
                                                    <span className="text-slate-200 dark:text-slate-800">|</span>
                                                    <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">{plan.durationDays} Days Access</span>
                                                </div>
                                            </div>
                                            {selectedPlanId === plan.id && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />}
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        </div>

                        <div className="grid gap-6 sm:gap-10 md:grid-cols-2 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="space-y-3">
                                <Label htmlFor="custom-duration" className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Override Duration (Days)</Label>
                                <Input
                                    id="custom-duration"
                                    type="number"
                                    min="1"
                                    placeholder={selectedPlan ? `${selectedPlan.durationDays} days (default)` : "Days"}
                                    value={customDuration}
                                    onChange={(e) => setCustomDuration(e.target.value)}
                                    className="h-12 sm:h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-xl sm:rounded-2xl font-black text-base sm:text-lg focus-visible:ring-[#E87154] shadow-inner"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="reason" className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Administrative Note</Label>
                                <Textarea
                                    id="reason"
                                    placeholder="e.g. Compensation for payment error"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="min-h-[50px] sm:min-h-[56px] h-12 sm:h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-xl sm:rounded-2xl font-medium focus-visible:ring-[#E87154] py-3 sm:py-4 shadow-inner"
                                />
                            </div>
                        </div>

                        {/* Summary Footer */}
                        <div className="bg-stone-50 rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 text-slate-900 flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-6 shadow-sm border border-stone-100 mt-4">
                            <div className="flex items-center gap-4 sm:gap-5">
                                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-white flex items-center justify-center text-[#E87154] shrink-0 border border-stone-200 shadow-sm">
                                    <Crown className="w-6 h-6 sm:w-7 sm:h-7" />
                                </div>
                                <div className="text-center lg:text-left">
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-1">Final Authorization</p>
                                    <p className="text-sm sm:text-base font-black flex items-center justify-center lg:justify-start gap-2 sm:gap-3">
                                        <span className="text-slate-900 truncate max-w-[100px] sm:max-w-none">{selectedPlan?.name || "Select Plan"}</span>
                                        <span className="text-stone-400 font-normal">→</span>
                                        <span className="text-[#E87154] truncate max-w-[100px] sm:max-w-none">{selectedProfileId ? children.find((c) => c.id === selectedProfileId)?.name : "Parent"}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 sm:gap-4 w-full lg:w-auto">
                                <Button variant="ghost" className="flex-1 lg:flex-none h-12 sm:h-14 rounded-xl sm:rounded-2xl text-stone-400 font-bold hover:text-slate-900 hover:bg-stone-100 transition-all text-sm sm:text-base px-6 sm:px-8" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button 
                                    className="flex-1 lg:flex-none h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-lg shadow-[#E87154]/20 transition-all active:scale-95 text-white px-6 sm:px-10 text-sm sm:text-base" 
                                    onClick={handleSubmit} 
                                    disabled={loading || !selectedPlanId}
                                >
                                    {loading ? (
                                        <Loader2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                    ) : (
                                        <ShieldCheck className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                                    )}
                                    Assign Now
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
