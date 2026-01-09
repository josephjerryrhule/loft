"use client";

import { useState } from "react";
import { PaystackButton } from "./PaystackButton";
import { processProductPayment } from "@/app/actions/payment";
import { getPaystackPublicKey } from "@/lib/paystack";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PurchaseProductButtonProps {
  product: {
    id: string;
    title: string;
    price: number | string;
  };
  userEmail: string;
  userId: string;
  quantity?: number;
}

export function PurchaseProductButton({ 
  product, 
  userEmail, 
  userId,
  quantity = 1 
}: PurchaseProductButtonProps) {
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
      const result = await processProductPayment(reference, product.id, quantity);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Purchase completed successfully!");
        router.refresh();
      }
    } catch {
      toast.error("Failed to process purchase");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    toast.info("Payment cancelled");
  };

  const reference = `ORD-${userId}-${Date.now()}`;
  const amount = Number(product.price) * quantity;

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
        type: "product",
        productId: product.id,
        productTitle: product.title,
        userId: userId,
        quantity: quantity,
      }}
      onSuccess={(ref) => handleSuccess(ref.reference)}
      onClose={handleClose}
      disabled={loading}
      className="w-full"
    >
      {loading ? "Processing..." : "Buy Now"}
    </PaystackButton>
  );
}
