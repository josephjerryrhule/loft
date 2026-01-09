"use client";

import { useState } from "react";
import { PaystackButton } from "./PaystackButton";
import { processSubscriptionPayment } from "@/app/actions/payment";
import { getPaystackPublicKey } from "@/lib/paystack";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SubscribePlanButtonProps {
  plan: {
    id: string;
    name: string;
    price: number | string;
  };
  userEmail: string;
  userId: string;
}

export function SubscribePlanButton({ plan, userEmail, userId }: SubscribePlanButtonProps) {
  const router = useRouter();
  const [publicKey, setPublicKey] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Load Paystack public key
  useState(() => {
    getPaystackPublicKey().then(setPublicKey);
  });

  const handleSuccess = async (reference: string) => {
    setLoading(true);
    try {
      const result = await processSubscriptionPayment(reference, plan.id);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Subscription activated successfully!");
        router.refresh();
      }
    } catch {
      toast.error("Failed to activate subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    toast.info("Payment cancelled");
  };

  const reference = `SUB-${userId}-${Date.now()}`;
  const amount = Number(plan.price);

  if (!publicKey) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <PaystackButton
      email={userEmail}
      amount={amount}
      reference={reference}
      publicKey={publicKey}
      metadata={{
        type: "subscription",
        planId: plan.id,
        planName: plan.name,
        userId: userId,
      }}
      onSuccess={(ref) => handleSuccess(ref.reference)}
      onClose={handleClose}
      disabled={loading}
      className="w-full"
    >
      {loading ? "Processing..." : "Subscribe"}
    </PaystackButton>
  );
}
