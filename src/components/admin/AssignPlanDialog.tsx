"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Crown, User, Baby } from "lucide-react";
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
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-amber-500" />
                        Assign Plan
                    </DialogTitle>
                    <DialogDescription>
                        Manually assign a subscription plan to <strong>{userName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                {dataLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-5 py-2">
                        {/* Profile Selection */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Assign to</Label>
                            <RadioGroup value={selectedProfileId} onValueChange={setSelectedProfileId}>
                                <div className="space-y-2">
                                    <div
                                        className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all hover:bg-accent ${
                                            selectedProfileId === "" ? "border-primary bg-primary/5" : ""
                                        }`}
                                        onClick={() => setSelectedProfileId("")}
                                    >
                                        <RadioGroupItem value="" id="admin-profile-parent" />
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <Label htmlFor="admin-profile-parent" className="font-semibold block cursor-pointer text-sm">
                                                {userName}
                                            </Label>
                                            <span className="text-xs text-muted-foreground">Parent account</span>
                                        </div>
                                    </div>

                                    {children.length > 0 && (
                                        <>
                                            <div className="relative py-1">
                                                <div className="absolute inset-0 flex items-center">
                                                    <span className="w-full border-t" />
                                                </div>
                                                <div className="relative flex justify-center text-xs uppercase">
                                                    <span className="bg-background px-2 text-muted-foreground font-medium">
                                                        Children
                                                    </span>
                                                </div>
                                            </div>
                                            {children.map((child) => (
                                                <div
                                                    key={child.id}
                                                    className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all hover:bg-accent ${
                                                        selectedProfileId === child.id ? "border-primary bg-primary/5" : ""
                                                    }`}
                                                    onClick={() => setSelectedProfileId(child.id)}
                                                >
                                                    <RadioGroupItem value={child.id} id={`admin-profile-${child.id}`} />
                                                    <div
                                                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                                        style={{ backgroundColor: child.avatarColor || "#6366f1" }}
                                                    >
                                                        {child.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1">
                                                        <Label
                                                            htmlFor={`admin-profile-${child.id}`}
                                                            className="font-semibold block cursor-pointer text-sm"
                                                        >
                                                            {child.name}
                                                        </Label>
                                                        <span className="text-xs text-muted-foreground">
                                                            {child.subscriptions?.length > 0
                                                                ? `Current: ${child.subscriptions[0].plan.name}`
                                                                : "No plan"}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Plan Selection */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Select Plan</Label>
                            <RadioGroup value={selectedPlanId} onValueChange={setSelectedPlanId}>
                                <div className="grid grid-cols-1 gap-2">
                                    {plans.map((plan) => (
                                        <div
                                            key={plan.id}
                                            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all hover:bg-accent ${
                                                selectedPlanId === plan.id ? "border-primary bg-primary/5" : ""
                                            }`}
                                            onClick={() => setSelectedPlanId(plan.id)}
                                        >
                                            <RadioGroupItem value={plan.id} id={`admin-plan-${plan.id}`} />
                                            <div className="flex-1">
                                                <Label htmlFor={`admin-plan-${plan.id}`} className="font-medium block cursor-pointer text-sm">
                                                    {plan.name}
                                                </Label>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="font-bold text-primary">GHS {Number(plan.price).toFixed(2)}</span>
                                                    <span>•</span>
                                                    <span>{plan.durationDays} days</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Custom Duration (Optional) */}
                        <div className="space-y-2">
                            <Label htmlFor="custom-duration" className="text-sm font-medium">
                                Custom Duration (days) <span className="text-muted-foreground font-normal">— optional</span>
                            </Label>
                            <Input
                                id="custom-duration"
                                type="number"
                                min="1"
                                placeholder={selectedPlan ? `Default: ${selectedPlan.durationDays} days` : "Enter days"}
                                value={customDuration}
                                onChange={(e) => setCustomDuration(e.target.value)}
                            />
                        </div>

                        {/* Reason (Optional) */}
                        <div className="space-y-2">
                            <Label htmlFor="reason" className="text-sm font-medium">
                                Reason <span className="text-muted-foreground font-normal">— optional</span>
                            </Label>
                            <Textarea
                                id="reason"
                                placeholder="e.g. Payment was successful but plan not assigned"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={2}
                            />
                        </div>

                        {/* Summary */}
                        {selectedPlan && (
                            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1 border">
                                <p className="font-medium">Summary</p>
                                <p className="text-muted-foreground">
                                    Assign <strong className="text-foreground">{selectedPlan.name}</strong> to{" "}
                                    <strong className="text-foreground">
                                        {selectedProfileId
                                            ? children.find((c) => c.id === selectedProfileId)?.name || "Child"
                                            : userName}
                                    </strong>{" "}
                                    for <strong className="text-foreground">{displayDuration} days</strong>
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-2 border-t">
                            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
                                Cancel
                            </Button>
                            <Button size="sm" onClick={handleSubmit} disabled={loading || !selectedPlanId}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Assigning...
                                    </>
                                ) : (
                                    <>
                                        <Crown className="mr-2 h-4 w-4" />
                                        Assign Plan
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
