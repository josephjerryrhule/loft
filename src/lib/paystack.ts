// Paystack payment utilities
import { getSystemSettings } from "@/app/actions/settings";

/**
 * Gets the active Paystack public key based on the current mode
 */
export async function getPaystackPublicKey(): Promise<string> {
  const settings = await getSystemSettings();
  const mode = settings.paystackMode || "test";
  
  if (mode === "live") {
    return settings.paystackLivePublicKey || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
  }
  
  return settings.paystackTestPublicKey || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
}

/**
 * Gets the active Paystack secret key based on the current mode (server-side only)
 */
export async function getPaystackSecretKey(): Promise<string> {
  const settings = await getSystemSettings();
  const mode = settings.paystackMode || "test";
  
  if (mode === "live") {
    return settings.paystackLiveSecretKey || process.env.PAYSTACK_SECRET_KEY || "";
  }
  
  return settings.paystackTestSecretKey || process.env.PAYSTACK_SECRET_KEY || "";
}

export function formatAmountForPaystack(amount: number): number {
  // Paystack expects amount in kobo (smallest currency unit)
  // For GHS, 1 GHS = 100 pesewas
  return Math.round(amount * 100);
}

export interface PaystackPaymentData {
  email: string;
  amount: number; // in kobo/pesewas
  reference: string;
  metadata?: {
    custom_fields?: Array<{
      display_name: string;
      variable_name: string;
      value: string | number;
    }>;
    [key: string]: any;
  };
  callback_url?: string;
  channels?: string[];
}
