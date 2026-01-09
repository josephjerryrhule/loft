"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PaystackButtonProps {
  email: string;
  amount: number; // In GHS (will be converted to pesewas)
  reference: string;
  publicKey: string;
  metadata?: Record<string, unknown>;
  onSuccess: (response: { reference: string }) => void;
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

interface PaystackPopHandler {
  setup: (config: Record<string, unknown>) => { openIframe: () => void };
}

declare global {
  interface Window {
    PaystackPop: PaystackPopHandler;
  }
}

export function PaystackButton({
  email,
  amount,
  reference,
  publicKey,
  metadata,
  onSuccess,
  onClose,
  className,
  children,
  disabled
}: PaystackButtonProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Load Paystack inline script
    const existingScript = document.getElementById("paystack-inline-js");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "paystack-inline-js";
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    } else {
      // Check if script is loaded by testing window.PaystackPop
      const checkInterval = setInterval(() => {
        if (window.PaystackPop) {
          setScriptLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      
      // Cleanup interval after 5 seconds
      setTimeout(() => clearInterval(checkInterval), 5000);
      
      return () => clearInterval(checkInterval);
    }
  }, []);

  const handlePayment = () => {
    if (!scriptLoaded || !window.PaystackPop) {
      toast.error("Payment system is loading, please try again");
      return;
    }

    if (!publicKey) {
      toast.error("Payment configuration error. Please contact support.");
      return;
    }

    setLoading(true);

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: email,
      amount: Math.round(amount * 100), // Convert to pesewas
      currency: "GHS",
      ref: reference,
      metadata: metadata,
      callback: function (response: { reference: string }) {
        setLoading(false);
        onSuccess({ reference: response.reference });
      },
      onClose: function () {
        setLoading(false);
        if (onClose) onClose();
      },
    });

    handler.openIframe();
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading || !scriptLoaded}
      className={className}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children || "Pay Now"}
    </Button>
  );
}
