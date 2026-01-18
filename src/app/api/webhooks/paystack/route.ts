import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
      .update(body)
      .digest("hex");

    const signature = request.headers.get("x-paystack-signature");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    // Handle successful charge
    if (event.event === "charge.success") {
      const { reference, amount, customer, metadata } = event.data;

      // Log webhook event
      await prisma.activityLog.create({
        data: {
          userId: metadata?.userId || customer.email,
          actionType: "PAYMENT_RECEIVED",
          actionDetails: JSON.stringify({
            reference,
            amount: amount / 100, // Convert from pesewas
            type: metadata?.type,
            itemId: metadata?.itemId,
          }),
        },
      });

      // Process fulfillment based on type
      if (metadata?.type === "subscription") {
          const { processSubscriptionPayment } = await import("@/app/actions/payment");
          await processSubscriptionPayment(reference, metadata.itemId, metadata.userId);
      } else if (metadata?.type === "product") {
          const { processProductPayment } = await import("@/app/actions/payment");
          // Assuming product payment action is also updated to handle background processing if needed
          // For now, retaining existing signature but it might need userId injection if refactored strictly
          // Checking existing signature in previous turn: processProductPayment(reference, productId, quantity, ...)
          // It relies on session currently. I should probably update it too if I want full webhook support for products, 
          // but scope is Plans. However, let's keep it safe. 
          // The current processProductPayment throws Unauthorized if no session.
          // So this won't work for products via webhook yet unless refactored.
          // Focusing on subscription as per request.
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
