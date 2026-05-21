import { getSystemSettingsServerSecret } from "@/app/actions/settings";

async function getPaypalConfig() {
  const settings = await getSystemSettingsServerSecret();
  const isLive = settings.paypalMode === "live";
  const clientId = isLive ? settings.paypalLiveClientId : settings.paypalTestClientId;
  const clientSecret = isLive ? settings.paypalLiveClientSecret : settings.paypalTestClientSecret;
  const baseUrl = isLive ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

  return { clientId, clientSecret, baseUrl };
}

export async function getPaypalAccessToken(): Promise<string> {
  const { clientId, clientSecret, baseUrl } = await getPaypalConfig();
  if (!clientId || !clientSecret) {
    throw new Error("PayPal client credentials are not configured.");
  }

  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authString}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("PayPal token error:", errorText);
    throw new Error("Failed to authenticate with PayPal.");
  }

  const data = await response.json();
  return data.access_token;
}

export async function createPaypalOrder(params: {
  amount: number;
  currency: string;
  reference: string;
  customId?: string;
  returnUrl: string;
  cancelUrl: string;
}) {
  const { baseUrl } = await getPaypalConfig();
  const token = await getPaypalAccessToken();

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.reference,
          custom_id: params.customId,
          amount: {
            currency_code: params.currency.toUpperCase(),
            value: params.amount.toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        user_action: "PAY_NOW",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("PayPal order creation error:", errorText);
    throw new Error("Failed to create PayPal order.");
  }

  return await response.json();
}

export async function capturePaypalOrder(orderId: string) {
  const { baseUrl } = await getPaypalConfig();
  const token = await getPaypalAccessToken();

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("PayPal order capture error:", errorText);
    throw new Error("Failed to capture PayPal order.");
  }

  return await response.json();
}
