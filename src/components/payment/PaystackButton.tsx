"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { initializePayment } from "@/app/actions/payment";

interface PaystackButtonProps {
  email: string;
  amount: number; // In GHS
  reference: string;
  publicKey?: string; // No longer needed for redirect
  metadata?: {
    type: "subscription" | "product";
    productId?: string;
    planId?: string;
    userId: string;
    quantity?: number;
    customizationData?: string;
    [key: string]: unknown;
  };
  onSuccess?: (response: { reference: string }) => void; // Optional for redirect
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

export function PaystackButton({
  email,
  amount,
  reference,
  metadata,
  className,
  children,
  disabled
}: PaystackButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!metadata?.type) {
      toast.error("Payment configuration error");
      return;
    }

    setLoading(true);

    try {
      const callbackUrl = `${window.location.origin}/payment/callback`;
      
      const result = await initializePayment({
        type: metadata.type,
        email: email,
        amount: amount,
        reference: reference,
        itemId: metadata.type === "subscription" ? metadata.planId! : metadata.productId!,
        quantity: metadata.quantity,
        customizationData: metadata.customizationData,
        callbackUrl: callbackUrl,
      });

      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      if (result.authorizationUrl) {
        // Redirect to Paystack payment page
        window.location.href = result.authorizationUrl;
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initialize payment");
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading}
      className={className}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children || "Pay Now"}
    </Button>
  );
}
