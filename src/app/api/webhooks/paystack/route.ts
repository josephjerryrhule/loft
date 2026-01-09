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

      // Additional processing can be done here if needed
      // The main processing is done via the processSubscriptionPayment/processProductPayment actions
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
