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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Loader2 } from "lucide-react";
import { updatePlan } from "@/app/actions/plans";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EditPlanDialogProps {
  plan: {
    id: string;
    name: string;
    description: string | null;
    price: number | string;
    durationDays: number;
    features: string | null;
    isActive: boolean;
  };
}

export function EditPlanDialog({ plan }: EditPlanDialogProps) {
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
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Plan</DialogTitle>
          <DialogDescription>Update subscription plan details.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Plan Name</Label>
            <Input 
              id="name" 
              name="name" 
              defaultValue={plan.name}
              placeholder="Premium" 
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              name="description" 
              defaultValue={plan.description || ""}
              placeholder="Access to all premium content" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (GHS)</Label>
              <Input 
                id="price" 
                name="price" 
                type="number" 
                step="0.01" 
                defaultValue={Number(plan.price).toFixed(2)}
                placeholder="49.99" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationDays">Duration (days)</Label>
              <Input 
                id="durationDays" 
                name="durationDays" 
                type="number" 
                defaultValue={plan.durationDays}
                placeholder="30" 
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="features">Features (one per line)</Label>
            <Textarea 
              id="features" 
              name="features" 
              defaultValue={plan.features || ""}
              placeholder="Unlimited flipbooks&#10;Priority support&#10;Early access" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="isActive">Status</Label>
            <Select 
              value={status} 
              onValueChange={setStatus}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="isActive" value={status === "active" ? "true" : "false"} />
          </div>
          <div className="flex gap-2">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Plan
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
