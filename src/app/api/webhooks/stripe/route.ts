import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripeInstance } from "@/lib/stripe";
import { getSystemSettingsServerSecret } from "@/app/actions/settings";
import { processStripeSubscriptionPayment } from "@/app/actions/payment";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return new NextResponse("Missing Stripe signature", { status: 400 });
    }

    const settings = await getSystemSettingsServerSecret();
    const stripeMode = settings.stripeMode || "test";
    const webhookSecret = stripeMode === "live" ? settings.stripeLiveWebhookSecret : settings.stripeTestWebhookSecret;

    if (!webhookSecret) {
      console.warn("Stripe webhook secret is not configured.");
      return new NextResponse("Webhook secret unconfigured", { status: 500 });
    }

    const stripe = await getStripeInstance();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      await processStripeSubscriptionPayment(session.id);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe webhook processing failed:", error);
    return new NextResponse(`Webhook error: ${error.message}`, { status: 400 });
  }
}
