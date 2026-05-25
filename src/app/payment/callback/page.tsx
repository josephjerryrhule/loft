import { Suspense } from "react";
import { redirect } from "next/navigation";
import { 
  processSubscriptionPayment, 
  processProductPayment,
  processStripeSubscriptionPayment,
  processPaypalSubscriptionPayment
} from "@/app/actions/payment";
import { getPaystackSecretKey } from "@/lib/paystack";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

interface PaymentVerificationResult {
  success: boolean;
  type: "subscription" | "product";
  message: string;
  orderId?: string;
  requiresCustomization?: boolean;
}

async function verifyAndProcessPayment(params: {
  reference?: string;
  gateway?: string;
  session_id?: string;
  token?: string;
}): Promise<PaymentVerificationResult> {
  const { reference, gateway, session_id, token } = params;

  if (gateway === "stripe" && session_id) {
    try {
      const result = await processStripeSubscriptionPayment(session_id);
      if (result.error) {
        return { success: false, type: "subscription", message: result.error };
      }
      return { success: true, type: "subscription", message: "Subscription activated successfully via Stripe!" };
    } catch (err) {
      console.error("Stripe callback processing error:", err);
      return { success: false, type: "subscription", message: "Failed to process Stripe payment" };
    }
  }

  if (gateway === "paypal" && token) {
    try {
      const result = await processPaypalSubscriptionPayment(token);
      if (result.error) {
        return { success: false, type: "subscription", message: result.error };
      }
      return { success: true, type: "subscription", message: "Subscription activated successfully via PayPal!" };
    } catch (err) {
      console.error("PayPal callback processing error:", err);
      return { success: false, type: "subscription", message: "Failed to process PayPal payment" };
    }
  }

  // Default to Paystack
  if (!reference) {
    return { success: false, type: "subscription", message: "Missing payment reference" };
  }

  try {
    const secretKey = await getPaystackSecretKey();
    
    if (!secretKey) {
      return { success: false, type: "product", message: "Payment configuration error" };
    }

    // Verify the transaction with Paystack
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!result.status || result.data.status !== "success") {
      return { success: false, type: "product", message: "Payment verification failed" };
    }

    const metadata = result.data.metadata || {};
    const type = metadata.type as "subscription" | "product";
    const itemId = metadata.itemId || metadata.planId || metadata.productId;
    const quantity = metadata.quantity || 1;
    const customizationData = metadata.customizationData;
    const customerUploadUrl = metadata.customerUploadUrl;

    if (type === "subscription") {
      try {
        const subscriptionResult = await processSubscriptionPayment(reference, itemId, metadata.userId);
        if (subscriptionResult.error) {
          return { success: false, type, message: subscriptionResult.error };
        }
        return { success: true, type, message: "Subscription activated successfully!" };
      } catch (err) {
        console.error("Subscription processing error:", err);
        return { success: false, type, message: "Failed to process subscription" };
      }
    } else if (type === "product") {
      try {
        const productResult = await processProductPayment(reference, itemId, quantity, customizationData, customerUploadUrl, true);
        if (productResult.error) {
          return { success: false, type, message: productResult.error };
        }
        
        let requiresCustomization = false;
        try {
          const product = await prisma.product.findUnique({
            where: { id: itemId },
            select: { requiresCustomization: true }
          });
          requiresCustomization = product?.requiresCustomization || false;
        } catch (e) {
          console.error("Failed to query product customization flag in callback:", e);
        }

        return { 
          success: true, 
          type, 
          message: "Purchase completed successfully!",
          orderId: (productResult as any).order?.id,
          requiresCustomization
        };
      } catch (err) {
        console.error("Product processing error:", err);
        return { success: false, type, message: "Failed to process order" };
      }
    }

    return { success: false, type: "product", message: "Unknown payment type" };
  } catch (error) {
    console.error("Payment callback error:", error);
    return { success: false, type: "product", message: "Failed to process payment" };
  }
}

async function PaymentResult({ 
  params 
}: { 
  params: { reference?: string; gateway?: string; session_id?: string; token?: string } 
}) {
  const result = await verifyAndProcessPayment(params);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFAF5] p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
        <CardContent className="pt-8 text-center space-y-6 px-6 sm:px-8">
          {result.success ? (
            <>
              <div className="relative mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Successful!</h1>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{result.message}</p>
              </div>
              
              {result.requiresCustomization && result.orderId ? (
                <div className="pt-2 space-y-4">
                  <div className="bg-[#FFF8F6] p-6 rounded-[2rem] border border-[#E87154]/20 space-y-3">
                    <div className="flex justify-center text-[#E87154]">
                      <Sparkles className="h-8 w-8 animate-bounce" />
                    </div>
                    <h3 className="font-black text-base text-[#E87154] tracking-tight">Personalization Required</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      To start printing and handcrafting your Birthday Book, please submit child details and photos.
                    </p>
                    <Link href={`/customer/orders/personalize?orderId=${result.orderId}`}>
                      <Button className="w-full bg-[#E87154] hover:bg-[#D66144] font-black text-white h-12 rounded-xl shadow-lg shadow-[#E87154]/20 transition-all active:scale-95 gap-2">
                        Personalize Your Book
                      </Button>
                    </Link>
                  </div>
                  <Link href="/customer/orders" className="block text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
                    Or personalize later from My Orders
                  </Link>
                </div>
              ) : result.type === "subscription" ? (
                  <div className="pt-2 space-y-2">
                    <Link href="/parent">
                      <Button className="w-full bg-slate-900 hover:bg-black font-black text-white h-12 rounded-xl transition-all">Go to Dashboard</Button>
                    </Link>
                    <Link href="/parent/plans">
                      <Button variant="outline" className="w-full h-12 rounded-xl font-bold">View Plans</Button>
                    </Link>
                  </div>
              ) : (
                  <div className="pt-2 space-y-2">
                    <Link href="/customer/orders">
                      <Button className="w-full bg-slate-900 hover:bg-black font-black text-white h-12 rounded-xl transition-all">View My Orders</Button>
                    </Link>
                    <Link href="/products">
                      <Button variant="outline" className="w-full h-12 rounded-xl font-bold">Continue Shopping</Button>
                    </Link>
                  </div>
              )}
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <h1 className="text-2xl font-bold text-red-600">Payment Failed</h1>
              <p className="text-muted-foreground">{result.message}</p>
              
              <div className="pt-4 space-y-2">
                <Link href="/products">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
          <h1 className="text-2xl font-bold">Processing Payment...</h1>
          <p className="text-muted-foreground">Please wait while we verify your payment.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string; gateway?: string; session_id?: string; token?: string }>;
}) {
  const params = await searchParams;
  const reference = params.reference || params.trxref;
  const gateway = params.gateway;
  const session_id = params.session_id;
  const token = params.token;

  if (!reference && !session_id && !token) {
    redirect("/products");
  }

  return (
    <Suspense fallback={<LoadingState />}>
      <PaymentResult params={{ reference, gateway, session_id, token }} />
    </Suspense>
  );
}
