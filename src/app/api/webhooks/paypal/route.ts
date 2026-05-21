import { NextResponse } from "next/server";
import { processPaypalSubscriptionPayment } from "@/app/actions/payment";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const eventType = payload.event_type;

    if (eventType === "CHECKOUT.ORDER.APPROVED" || eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const orderId = payload.resource?.id;
      if (orderId) {
        await processPaypalSubscriptionPayment(orderId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("PayPal webhook processing failed:", error);
    return new NextResponse(`Webhook error: ${error.message}`, { status: 400 });
  }
}
