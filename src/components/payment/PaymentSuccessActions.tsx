"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function PaymentSuccessActions({ reference }: { reference: string }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoToDashboard = async () => {
        setIsLoading(true);
        try {
            await signIn("credentials", { 
                paymentReference: reference, 
                callbackUrl: "/customer",
                redirect: true
            });
        } catch (error) {
            console.error("Auto-login failed:", error);
            window.location.href = "/customer";
        }
    };

    return (
        <div className="pt-4 space-y-2">
            <Button onClick={handleGoToDashboard} className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Go to Dashboard
            </Button>
        </div>
    );
}
