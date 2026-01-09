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

/**
 * Initialize a Paystack transaction and get the authorization URL for redirect
 */
export async function initializePaystackTransaction(data: {
  email: string;
  amount: number; // in GHS (will be converted)
  reference: string;
  metadata?: Record<string, any>;
  callbackUrl: string;
}): Promise<{ success: boolean; authorizationUrl?: string; error?: string }> {
  try {
    const secretKey = await getPaystackSecretKey();
    
    if (!secretKey) {
      return { success: false, error: "Payment configuration error" };
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        amount: formatAmountForPaystack(data.amount),
        reference: data.reference,
        callback_url: data.callbackUrl,
        metadata: data.metadata,
      }),
    });

    const result = await response.json();

    if (result.status && result.data?.authorization_url) {
      return { success: true, authorizationUrl: result.data.authorization_url };
    }

    return { success: false, error: result.message || "Failed to initialize payment" };
  } catch (error) {
    console.error("Paystack initialization error:", error);
    return { success: false, error: "Failed to initialize payment" };
  }
}
