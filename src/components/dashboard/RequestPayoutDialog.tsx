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
import { Loader2 } from "lucide-react";
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
                <Button disabled={!canRequestPayout}>
                    Request Payout
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request Payout</DialogTitle>
                    <DialogDescription>
                        Available Balance: GHS {availableBalance.toFixed(2)}
                        {availableBalance < minimumPayoutAmount && (
                            <span className="block text-red-500 mt-1">
                                Minimum payout amount: GHS {minimumPayoutAmount.toFixed(2)}
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (GHS)</Label>
                        <Input 
                            id="amount" 
                            name="amount" 
                            type="number" 
                            max={availableBalance} 
                            min={1} 
                            step="0.01" 
                            required 
                            defaultValue={availableBalance}
                        />
                    </div>
                    <div className="space-y-2">
                         <Label htmlFor="methodType">Payment Method</Label>
                         <Select name="methodType" defaultValue="momo">
                            <SelectTrigger>
                                <SelectValue placeholder="Select Method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="momo">Mobile Money</SelectItem>
                                <SelectItem value="bank">Bank Transfer</SelectItem>
                            </SelectContent>
                         </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="details">Payment Details</Label>
                        <Textarea 
                            id="details" 
                            name="details" 
                            placeholder="e.g. 0541234567 (MTN), or Bank Name & Account Number" 
                            required 
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
