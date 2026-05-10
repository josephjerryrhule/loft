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
import { AlertCircle } from "lucide-react";
import { getAgeGroupLabel } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  price: number | string | Decimal;
  description?: string | null;
}

interface SubscribePlanButtonProps {
  plan?: Plan; // The specific plan if already selected
  allPlans?: Plan[]; // All available plans to choose from
  userEmail: string;
  userId: string;
  childProfiles: any[];
  initialChildId?: string;
  label?: string;
}

export function SubscribePlanButton({ 
  plan, 
  allPlans, 
  userEmail, 
  userId, 
  childProfiles, 
  initialChildId, 
  label 
}: SubscribePlanButtonProps) {
  const [reference] = useState(() => `SUB-${userId}-${Date.now()}`);
  const [open, setOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string>(initialChildId || "");
  // If a plan is passed, use it. Otherwise, default to the first plan in allPlans.
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plan?.id || allPlans?.[0]?.id || "");
  
  const selectedPlan = plan || allPlans?.find(p => p.id === selectedPlanId);
  const amount = selectedPlan ? Number(selectedPlan.price) : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">{label || "Subscribe"}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Profile</DialogTitle>
          <DialogDescription>
            Choose who will use this subscription. Reading progress and access will be tracked for this profile.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <RadioGroup value={selectedChildId} onValueChange={setSelectedChildId}>
            <div className="space-y-3">
              {/* Parent Option */}
              <div 
                className={`flex items-center space-x-3 rounded-xl border p-4 hover:bg-accent cursor-pointer transition-all ${selectedChildId === "" ? "border-primary bg-primary/5" : ""}`}
                onClick={() => setSelectedChildId("")}
              >
                <RadioGroupItem value="" id="parent-me" />
                <div className="flex-1 cursor-pointer">
                  <Label htmlFor="parent-me" className="font-semibold block">
                    Parent Profile (Me)
                  </Label>
                  <span className="text-xs text-muted-foreground">Full access for the parent account</span>
                </div>
              </div>

              {/* separator if children exist */}
              {childProfiles.length > 0 && (
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground font-medium">Child Profiles</span>
                  </div>
                </div>
              )}

              {/* Children Options */}
              {childProfiles.map((child) => (
                <div 
                  key={child.id} 
                  className={`flex items-center space-x-3 rounded-xl border p-4 hover:bg-accent cursor-pointer transition-all ${selectedChildId === child.id ? "border-primary bg-primary/5" : ""}`}
                  onClick={() => setSelectedChildId(child.id)}
                >
                  <RadioGroupItem value={child.id} id={`child-${child.id}`} />
                  <div className="flex-1 cursor-pointer">
                    <Label htmlFor={`child-${child.id}`} className="font-semibold block">
                      {child.name}
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {child.ageGroup ? getAgeGroupLabel(child.ageGroup) : "No age group set"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>

          {/* Plan Selection - only show if allPlans is provided and no plan is fixed */}
          {allPlans && allPlans.length > 0 && !plan && (
            <div className="space-y-4 pt-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground font-medium">Select Plan</span>
                </div>
              </div>
              <RadioGroup value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <div className="grid grid-cols-1 gap-2">
                  {allPlans.map((p) => (
                    <div 
                      key={p.id} 
                      className={`flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent cursor-pointer transition-all ${selectedPlanId === p.id ? "border-primary bg-primary/5" : ""}`}
                      onClick={() => setSelectedPlanId(p.id)}
                    >
                      <RadioGroupItem value={p.id} id={`plan-${p.id}`} />
                      <div className="flex-1 cursor-pointer">
                        <Label htmlFor={`plan-${p.id}`} className="font-medium block">
                          {p.name}
                        </Label>
                        <span className="text-xs text-primary font-bold">GHS {Number(p.price).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {childProfiles.length === 0 && (
            <div className="rounded-lg bg-amber-500/10 p-3 flex items-start gap-3 border border-amber-500/20">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-600">No child profiles found</p>
                <p className="text-amber-600/80">You can still subscribe for yourself, or <Link href="/parent/children" className="underline font-bold">create a profile</Link> for your child.</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
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
              disabled={!selectedPlan || amount <= 0}
            >
              {amount > 0 ? `Pay GHS ${amount.toFixed(2)}` : "Select a Plan"}
            </PaystackButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
