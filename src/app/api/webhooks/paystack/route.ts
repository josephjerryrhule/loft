import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getPaystackSecretKey } from "@/lib/paystack";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    // Get secret key from system settings or env (matches other paystack usage)
    const secret = await getPaystackSecretKey();
    const hash = crypto
      .createHmac("sha512", secret || "")
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
            itemId: metadata?.itemId || metadata?.planId || metadata?.productId,
          }),
        },
      });

      // Process fulfillment based on type
      if (metadata?.type === "subscription") {
          const { processSubscriptionPayment } = await import("@/app/actions/payment");
          await processSubscriptionPayment(reference, metadata?.itemId || metadata?.planId, metadata?.userId);
      } else if (metadata?.type === "product") {
          const { processProductPayment } = await import("@/app/actions/payment");
          await processProductPayment(
            reference,
            metadata?.itemId || metadata?.productId || metadata?.planId,
            metadata?.quantity || 1,
            metadata?.customizationData,
            metadata?.customerUploadUrl,
            true,
            metadata?.userId
          );
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
