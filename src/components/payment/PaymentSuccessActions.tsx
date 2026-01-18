"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function PaymentSuccessActions({ reference }: { reference: string }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleViewPlans = async () => {
        setIsLoading(true);
        try {
            // Attempt to sign in using the payment reference
            await signIn("credentials", { 
                paymentReference: reference, 
                callbackUrl: "/customer/plans",
                redirect: true
            });
        } catch (error) {
            console.error("Auto-login failed:", error);
            // Fallback to manual redirect if login fails (e.g. timeout)
            window.location.href = "/auth/login";
        }
    };

    const handleContinueShopping = async () => {
        setIsLoading(true);
        try {
            await signIn("credentials", { 
                paymentReference: reference, 
                callbackUrl: "/products",
                redirect: true
            });
        } catch (error) {
            console.error("Auto-login failed:", error);
            window.location.href = "/products";
        }
    };

    return (
        <div className="pt-4 space-y-2">
            <Button onClick={handleViewPlans} className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                View My Plans
            </Button>
            <Button 
                variant="outline" 
                className="w-full"
                onClick={handleContinueShopping}
                disabled={isLoading}
            >
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Continue Shopping
            </Button>
        </div>
    );
}
