"use client";

import { useState } from "react";
import { PaystackButton } from "./PaystackButton";

import { Decimal } from "@prisma/client/runtime/library";

interface SubscribePlanButtonProps {
  plan: {
    id: string;
    name: string;
    price: number | string | Decimal;
  };
  userEmail: string;
  userId: string;
}

export function SubscribePlanButton({ plan, userEmail, userId }: SubscribePlanButtonProps) {
  const [reference] = useState(() => `SUB-${userId}-${Date.now()}`);
  const amount = Number(plan.price);

  return (
    <PaystackButton
      email={userEmail}
      amount={amount}
      reference={reference}
      metadata={{
        type: "subscription",
        planId: plan.id,
        userId: userId,
      }}
      className="w-full"
    >
      Subscribe
    </PaystackButton>
  );
}
