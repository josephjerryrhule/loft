"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { approveCommission, approvePayoutRequest } from "@/app/actions/admin";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, CheckCircle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AdminCommissionActions({ id, status }: { id: string, status: string }) {
    const [loading, setLoading] = useState(false);

    if (status !== "PENDING") return null;

    const handleApprove = async () => {
        setLoading(true);
        const res = await approveCommission(id);
        setLoading(false);
        if (res.success) {
            toast.success("Commission approved");
        } else {
            toast.error(res.error || "Failed to approve");
        }
    };

    return (
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleApprove} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 text-green-600" />}
        </Button>
    );
}

interface PayoutRequest {
    id: string;
    status: string;
    amount: number;
    requestedAt: Date;
    processedAt?: Date | null;
    paymentMethod?: string | null;
    user: {
        email: string;
        firstName?: string | null;
        lastName?: string | null;
        role: string;
    };
}

export function AdminPayoutActions({ payout }: { payout: PayoutRequest }) {
    const [loading, setLoading] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);

    const handleApprove = async () => {
        setLoading(true);
        const res = await approvePayoutRequest(payout.id);
        setLoading(false);
        if (res.success) {
            toast.success("Payout marked as paid");
        } else {
            toast.error(res.error || "Failed to process");
        }
    };

    let paymentMethodData: any = null;
    try {
        if (payout.paymentMethod) {
            paymentMethodData = JSON.parse(payout.paymentMethod);
        }
    } catch (e) {
        console.error("Failed to parse payment method:", e);
    }

    return (
        <div className="flex gap-2">
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Payout Request Details</DialogTitle>
                        <DialogDescription>
                            View payment information and request details
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium mb-2">User Information</h4>
                            <div className="space-y-1 text-sm">
                                <p>
                                    <span className="text-muted-foreground">Name:</span>{" "}
                                    {payout.user.firstName} {payout.user.lastName}
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Email:</span>{" "}
                                    {payout.user.email}
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Role:</span>{" "}
                                    <Badge variant="outline" className="ml-1">
                                        {payout.user.role}
                                    </Badge>
                                </p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium mb-2">Request Details</h4>
                            <div className="space-y-1 text-sm">
                                <p>
                                    <span className="text-muted-foreground">Amount:</span>{" "}
                                    <span className="font-semibold text-green-600">
                                        GHS {Number(payout.amount).toFixed(2)}
                                    </span>
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Status:</span>{" "}
                                    <Badge
                                        variant={
                                            payout.status === "PAID"
                                                ? "default"
                                                : payout.status === "APPROVED"
                                                ? "secondary"
                                                : "outline"
                                        }
                                        className="ml-1"
                                    >
                                        {payout.status}
                                    </Badge>
                                </p>
                                <p>
                                    <span className="text-muted-foreground">Requested:</span>{" "}
                                    {new Date(payout.requestedAt).toLocaleString()}
                                </p>
                                {payout.processedAt && (
                                    <p>
                                        <span className="text-muted-foreground">Processed:</span>{" "}
                                        {new Date(payout.processedAt).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        {paymentMethodData && (
                            <div>
                                <h4 className="text-sm font-medium mb-2">Payment Information</h4>
                                <div className="space-y-1 text-sm bg-muted p-3 rounded-md">
                                    <p>
                                        <span className="text-muted-foreground">Method:</span>{" "}
                                        <span className="font-medium capitalize">
                                            {paymentMethodData.type === "momo"
                                                ? "Mobile Money"
                                                : paymentMethodData.type === "bank"
                                                ? "Bank Transfer"
                                                : paymentMethodData.type}
                                        </span>
                                    </p>
                                    <p>
                                        <span className="text-muted-foreground">Details:</span>
                                    </p>
                                    <p className="font-mono text-xs bg-background p-2 rounded border">
                                        {paymentMethodData.details}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {payout.status === "PENDING" && (
                <Button size="sm" variant="outline" onClick={handleApprove} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Mark as Paid
                </Button>
            )}
        </div>
    );
}
