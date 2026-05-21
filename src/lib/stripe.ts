import Stripe from "stripe";
import { getSystemSettingsServerSecret } from "@/app/actions/settings";

export async function getStripeInstance() {
  const settings = await getSystemSettingsServerSecret();
  const stripeMode = settings.stripeMode || "test";
  const secretKey = stripeMode === "live" ? settings.stripeLiveSecretKey : settings.stripeTestSecretKey;

  if (!secretKey) {
    throw new Error("Stripe secret key is not configured.");
  }

  return new Stripe(secretKey, {
    apiVersion: "2025-02-18-preview" as any,
  });
}
