import { Suspense } from "react";
import { redirect } from "next/navigation";
import { processSubscriptionPayment, processProductPayment } from "@/app/actions/payment";
import { getPaystackSecretKey } from "@/lib/paystack";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PaymentVerificationResult {
  success: boolean;
  type: "subscription" | "product";
  message: string;
}

async function verifyAndProcessPayment(reference: string): Promise<PaymentVerificationResult> {
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
    const itemId = metadata.itemId;
    const quantity = metadata.quantity || 1;
    const customizationData = metadata.customizationData;
    const customerUploadUrl = metadata.customerUploadUrl;

    if (type === "subscription") {
      try {
        const subscriptionResult = await processSubscriptionPayment(reference, itemId);
        if (subscriptionResult.error) {
          return { success: false, type, message: subscriptionResult.error };
        }
        return { success: true, type, message: "Subscription activated successfully!" };
      } catch (err) {
        console.error("Subscription processing error:", err);
        // Check if it's a known benign error (like revalidatePath during render)
        if (err instanceof Error && err.message.includes("revalidatePath")) {
          return { success: true, type, message: "Subscription activated successfully!" };
        }
        return { success: false, type, message: "Failed to process subscription" };
      }
    } else if (type === "product") {
      try {
        const productResult = await processProductPayment(reference, itemId, quantity, customizationData, customerUploadUrl);
        if (productResult.error) {
          return { success: false, type, message: productResult.error };
        }
        return { success: true, type, message: "Purchase completed successfully!" };
      } catch (err) {
        console.error("Product processing error:", err);
        // Check if it's a known benign error (like revalidatePath during render)
        if (err instanceof Error && err.message.includes("revalidatePath")) {
          return { success: true, type, message: "Purchase completed successfully!" };
        }
        return { success: false, type, message: "Failed to process order" };
      }
    }

    return { success: false, type: "product", message: "Unknown payment type" };
  } catch (error) {
    console.error("Payment callback error:", error);
    return { success: false, type: "product", message: "Failed to process payment" };
  }
}

async function PaymentResult({ reference }: { reference: string }) {
  const result = await verifyAndProcessPayment(reference);

  const redirectPath = result.type === "subscription" 
    ? "/customer/plans" 
    : "/customer/orders";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          {result.success ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h1 className="text-2xl font-bold text-green-600">Payment Successful!</h1>
              <p className="text-muted-foreground">{result.message}</p>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <h1 className="text-2xl font-bold text-red-600">Payment Failed</h1>
              <p className="text-muted-foreground">{result.message}</p>
            </>
          )}
          
          <div className="pt-4 space-y-2">
            <Link href={redirectPath}>
              <Button className="w-full">
                {result.type === "subscription" ? "View My Plans" : "View My Orders"}
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" className="w-full">
                Continue Shopping
              </Button>
            </Link>
          </div>
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
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const params = await searchParams;
  const reference = params.reference || params.trxref;

  if (!reference) {
    redirect("/products");
  }

  return (
    <Suspense fallback={<LoadingState />}>
      <PaymentResult reference={reference} />
    </Suspense>
  );
}
