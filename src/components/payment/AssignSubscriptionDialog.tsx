"use client";

import { useState } from "react";
import { assignSubscriptionToChild } from "@/app/actions/plans";
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
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

interface ChildProfile {
  id: string;
  name: string;
  avatarColor?: string;
}

interface AssignSubscriptionDialogProps {
  subscriptionId: string;
  childProfiles: ChildProfile[];
}

export function AssignSubscriptionDialog({
  subscriptionId,
  childProfiles,
}: AssignSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string>(childProfiles[0]?.id || "");

  async function handleAssign() {
    if (!selectedChildId) {
      toast.error("Please select a child profile");
      return;
    }

    setIsLoading(true);
    try {
      const result = await assignSubscriptionToChild(subscriptionId, selectedChildId);
      if (result.success) {
        toast.success("Subscription assigned successfully!");
        setOpen(false);
      } else {
        toast.error(result.error || "Failed to assign subscription");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Assign to Child
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Subscription</DialogTitle>
          <DialogDescription>
            Choose which child profile should receive this subscription. 
            Any active plans they currently have will be replaced.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={selectedChildId} onValueChange={setSelectedChildId}>
            <div className="space-y-2">
              {childProfiles.map((child) => (
                <div
                  key={child.id}
                  className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all hover:bg-accent ${
                    selectedChildId === child.id ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setSelectedChildId(child.id)}
                >
                  <RadioGroupItem value={child.id} id={`assign-${child.id}`} />
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                    style={{ backgroundColor: child.avatarColor || "#6366f1" }}
                  >
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <Label
                      htmlFor={`assign-${child.id}`}
                      className="font-semibold block cursor-pointer"
                    >
                      {child.name}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={isLoading || !selectedChildId}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Assignment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
