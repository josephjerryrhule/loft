"use client";

import { useState } from "react";
import { PaystackButton } from "./PaystackButton";

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
  const [reference] = useState(() => `ORD-${userId}-${Date.now()}`);
  const amount = Number(product.price) * quantity;

  return (
    <PaystackButton
      email={userEmail}
      amount={amount}
      reference={reference}
      metadata={{
        type: "product",
        productId: product.id,
        userId: userId,
        quantity: quantity,
      }}
      className="w-full"
    >
      Buy Now
    </PaystackButton>
  );
}
