"use client";

import { Button } from "@/components/ui/button";
import { approveCommission, approvePayoutRequest } from "@/app/actions/admin";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";

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

export function AdminPayoutActions({ id, status }: { id: string, status: string }) {
    const [loading, setLoading] = useState(false);

    if (status !== "PENDING") return null;

    const handleApprove = async () => {
        setLoading(true);
        const res = await approvePayoutRequest(id);
        setLoading(false);
        if (res.success) {
            toast.success("Payout marked as paid");
        } else {
            toast.error(res.error || "Failed to process");
        }
    };

    return (
        <Button size="sm" variant="outline" onClick={handleApprove} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mark as Paid
        </Button>
    );
}
