"use client";

import { useState } from "react";
import { PaystackButton } from "./PaystackButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, User } from "lucide-react";
import { getAgeGroupLabel } from "@/lib/utils";
import Link from "next/link";
import { Role } from "@/lib/types";

interface Plan {
  id: string;
  name: string;
  price: number;
  description?: string | null;
}

interface ChildProfile {
  id: string;
  name: string;
  ageGroup?: string;
  avatarColor?: string;
}

interface SubscribePlanButtonProps {
  plan?: Plan; // The specific plan if already selected (used from plans table)
  allPlans?: Plan[]; // All available plans to choose from
  userEmail: string;
  userId: string;
  userRole?: Role | string;
  childProfiles?: ChildProfile[];
  initialChildId?: string; // Pre-select a specific child (lock to that child)
  allowSelfProfile?: boolean;
  label?: string;
}

export function SubscribePlanButton({
  plan,
  allPlans,
  userEmail,
  userId,
  userRole,
  childProfiles = [],
  initialChildId,
  allowSelfProfile = false,
  label,
}: SubscribePlanButtonProps) {
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState(() => `SUB-${userId}-${Date.now()}`);

  // Profile selection — locked if initialChildId is provided
  const defaultChildId = initialChildId ?? (allowSelfProfile ? "" : childProfiles[0]?.id ?? "");
  const [selectedChildId, setSelectedChildId] = useState<string>(defaultChildId);

  // Plan selection — locked if a specific plan is passed
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    plan?.id || allPlans?.[0]?.id || ""
  );

  const selectedPlan = plan || allPlans?.find((p) => p.id === selectedPlanId);
  const amount = selectedPlan ? Number(selectedPlan.price) : 0;

  // Whether this button is locked to a specific child profile
  const isChildLocked = Boolean(initialChildId);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Regenerate reference on each open so duplicate payments don't fail
      setReference(`SUB-${userId}-${Date.now()}`);
      setSelectedChildId(initialChildId ?? (allowSelfProfile ? "" : childProfiles[0]?.id ?? ""));
      setSelectedPlanId(plan?.id || allPlans?.[0]?.id || "");
    }
  };

  const dialogTitle = isChildLocked
    ? "Choose a Plan"
    : plan
    ? "Select Profile"
    : "Select Plan & Profile";

  const dialogDescription = isChildLocked
    ? "Select a plan to activate for this child."
    : plan
    ? "Choose who will benefit from this subscription."
    : "Choose a profile and a plan below.";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant={isChildLocked ? "default" : "outline"}>
          {label || "Subscribe"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* ── Profile Selection (hidden when child is locked) ── */}
          {!isChildLocked && (
            <RadioGroup value={selectedChildId} onValueChange={setSelectedChildId}>
              <div className="space-y-2">
                {allowSelfProfile && (
                  <div
                    className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all hover:bg-accent ${
                      selectedChildId === "" ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setSelectedChildId("")}
                  >
                    <RadioGroupItem value="" id="profile-self" />
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="profile-self" className="font-semibold block cursor-pointer">
                        My Profile
                      </Label>
                      <span className="text-xs text-muted-foreground">Full access for your account</span>
                    </div>
                  </div>
                )}

                {/* Child Options */}
                {childProfiles.length > 0 && (
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
                    {childProfiles.map((child) => (
                      <div
                        key={child.id}
                        className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all hover:bg-accent ${
                          selectedChildId === child.id ? "border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => setSelectedChildId(child.id)}
                      >
                        <RadioGroupItem value={child.id} id={`profile-${child.id}`} />
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ backgroundColor: child.avatarColor || "#6366f1" }}
                        >
                          {child.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <Label
                            htmlFor={`profile-${child.id}`}
                            className="font-semibold block cursor-pointer"
                          >
                            {child.name}
                          </Label>
                          <span className="text-xs text-muted-foreground">
                            {child.ageGroup
                              ? getAgeGroupLabel(child.ageGroup)
                              : "No age group set"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {childProfiles.length === 0 && userRole !== Role.CUSTOMER && (
                  <div className="rounded-lg bg-amber-500/10 p-3 flex items-start gap-3 border border-amber-500/20">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-600">No child profiles yet</p>
                      <p className="text-amber-600/80">
                        {allowSelfProfile ? "You can subscribe for yourself, or " : "Add a child profile to subscribe. "}
                        <Link
                          href="/parent/children"
                          className="underline font-bold"
                          onClick={() => setOpen(false)}
                        >
                          add a child profile
                        </Link>{" "}
                        {allowSelfProfile ? "first." : ""}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </RadioGroup>
          )}

          {/* ── Plan Selection (only when allPlans provided and no fixed plan) ── */}
          {allPlans && allPlans.length > 0 && !plan && (
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground font-medium">
                    Select Plan
                  </span>
                </div>
              </div>
              <RadioGroup value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <div className="grid grid-cols-1 gap-2">
                  {allPlans.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all hover:bg-accent ${
                        selectedPlanId === p.id ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => setSelectedPlanId(p.id)}
                    >
                      <RadioGroupItem value={p.id} id={`plan-${p.id}`} />
                      <div className="flex-1">
                        <Label htmlFor={`plan-${p.id}`} className="font-medium block cursor-pointer">
                          {p.name}
                        </Label>
                        <span className="text-xs text-primary font-bold">
                          GHS {Number(p.price).toFixed(2)}
                        </span>
                        {p.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {p.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <PaystackButton
              email={userEmail}
              amount={amount}
              reference={reference}
              metadata={{
                type: "subscription",
                planId: selectedPlan?.id || "",
                userId: userId,
                childProfileId: selectedChildId || null,
              }}
              disabled={!selectedPlan || amount <= 0 || (!allowSelfProfile && !selectedChildId)}
            >
              {!selectedPlan || amount <= 0
                ? "Select a Plan"
                : !allowSelfProfile && !selectedChildId
                ? "Select a Child"
                : `Pay GHS ${amount.toFixed(2)}`}
            </PaystackButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
