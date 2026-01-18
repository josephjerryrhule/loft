"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { processSubscriptionCommission } from "@/lib/commission";
import { getPaystackSecretKey } from "@/lib/paystack";
import { 
  sendSubscriptionConfirmationEmail, 
  sendSubscriptionReceiptEmail,
  sendOrderReceiptEmail,
  sendOrderNotificationToSupport
} from "@/lib/email";

// Verify payment with Paystack
interface PaystackVerificationData {
  amount: number;
  reference: string;
  status: string;
  metadata?: {
      userId?: string;
      type?: string;
      itemId?: string;
      [key: string]: any;
  };
}

async function verifyPaystackPayment(reference: string): Promise<{ success: boolean; data?: PaystackVerificationData; error?: string }> {
  try {
    const secretKey = await getPaystackSecretKey();

    if (!secretKey) {
      return { success: false, error: "Payment configuration error" };
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const result = await response.json();

    if (result.status && result.data.status === "success") {
      return { success: true, data: result.data };
    }

    return { success: false, error: "Payment verification failed" };
  } catch (error) {
    console.error("Payment verification error:", error);
    return { success: false, error: "Payment verification failed" };
  }
}

export async function processSubscriptionPayment(reference: string, planId: string, userId?: string) {
  // 1. Verify payment first to get metadata if possible (since we might not have a session)
  let verificationData;
  try {
    const verification = await verifyPaystackPayment(reference);
    if (verification.success && verification.data) {
        verificationData = verification.data;
    }
  } catch (e) {
      console.error("Verification error pre-check", e);
  }

  // 2. Determine Customer ID
  let customerId = userId;
  
  // If not passed, check metadata
  if (!customerId && verificationData?.metadata?.userId) {
      customerId = verificationData.metadata.userId;
  }

  // If still not found, check session
  if (!customerId) {
      const session = await auth();
      customerId = session?.user?.id;
  }

  if (!customerId) return { error: "Unauthorized" };

  try {
    // 3. If we didn't verify successfully above (rare), try again or use the data we have
    if (!verificationData) {
        const verification = await verifyPaystackPayment(reference);
        if (!verification.success || !verification.data) {
           return { error: verification.error || "Payment verification failed" };
        }
        verificationData = verification.data;
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) return { error: "Plan not found" };

    // Verify amount matches
    const amountPaid = verificationData.amount / 100; // Convert from pesewas to GHS
    if (amountPaid < Number(plan.price)) {
      return { error: "Payment amount mismatch" };
    }

    // Calculate subscription dates (start: now, end: now + duration days)
    const startDate = new Date();
    const endDate = new Date(startDate.getTime());
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // Cancel any existing active subscriptions
    await prisma.subscription.updateMany({
      where: {
        customerId: customerId,
        status: "ACTIVE",
      },
      data: { status: "CANCELLED" },
    });

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        customerId: customerId,
        planId,
        status: "ACTIVE",
        paymentStatus: "COMPLETED", // Payment verified via Paystack
        paymentReference: reference,
        startDate,
        endDate,
        autoRenew: false,
      },
      include: {
        customer: true // Include customer to get details for email
      }
    });

    // MARK USER AS VERIFIED
    // Since payment is successful, we can trust this user is real/active
    await prisma.user.update({
        where: { id: customerId },
        data: { isEmailVerified: true }
    });

    // Process commission for referrer immediately on successful payment
    await processSubscriptionCommission(
      subscription.id,
      customerId,
      Number(plan.price)
    );

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: customerId,
        actionType: "SUBSCRIPTION",
        actionDetails: JSON.stringify({
          planName: plan.name,
          amount: amountPaid,
          reference: reference,
          subscriptionId: subscription.id,
        }),
      },
    });

    // Send subscription emails
    if (subscription.customer) {
      const userName = `${subscription.customer.firstName || ""} ${subscription.customer.lastName || ""}`.trim() || "Customer";
      
      // Send confirmation email
      sendSubscriptionConfirmationEmail({
        userEmail: subscription.customer.email,
        userName,
        planName: plan.name,
        amount: amountPaid,
        startDate,
        endDate,
      }).catch(console.error);
      
      // Send receipt email
      sendSubscriptionReceiptEmail({
        userEmail: subscription.customer.email,
        userName,
        planName: plan.name,
        amount: amountPaid,
        transactionId: reference,
        billingPeriod: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      }).catch(console.error);
    }

    // Note: revalidatePath is handled by the calling page, not here
    // to avoid errors when called during render

    return { success: true, subscription };
  } catch (error) {
    console.error("Subscription payment processing error:", error);
    return { error: "Failed to process subscription payment" };
  }
}

export async function processProductPayment(
  reference: string,
  productId: string,
  quantity: number | string = 1,
  customizationData?: string,
  customerUploadUrl?: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // Ensure quantity is an integer
  const quantityInt = typeof quantity === 'string' ? parseInt(quantity, 10) : quantity;
  if (isNaN(quantityInt) || quantityInt < 1) {
    return { error: "Invalid quantity" };
  }

  try {
    // Verify payment with Paystack
    const verification = await verifyPaystackPayment(reference);

    if (!verification.success || !verification.data) {
      return { error: verification.error || "Payment verification failed" };
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) return { error: "Product not found" };

    const totalAmount = Number(product.price) * quantityInt;
    const amountPaid = verification.data.amount / 100; // Convert from pesewas to GHS

    // Verify amount matches
    if (amountPaid < totalAmount) {
      return { error: "Payment amount mismatch" };
    }

    // Get user's referrer and address for commission and shipping
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        referredById: true, 
        email: true, 
        firstName: true, 
        lastName: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      },
    });

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        customerId: session.user.id,
        productId: productId,
        quantity: quantityInt,
        unitPrice: product.price,
        totalAmount: totalAmount,
        customizationData: customizationData || null,
        customerUploadUrl: customerUploadUrl || null,
        status: "PROCESSING",
        paymentStatus: "PAID",
        paymentReference: reference,
        referredById: user?.referredById || undefined,
        // Copy shipping address from user profile
        shippingAddress: user?.address || null,
        shippingCity: user?.city || null,
        shippingState: user?.state || null,
        shippingPostalCode: user?.postalCode || null,
        shippingCountry: user?.country || null,
      },
    });

    // Note: Order commissions are processed when order status is marked as COMPLETED by admin

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        actionType: "CREATE_ORDER",
        actionDetails: JSON.stringify({
          productTitle: product.title,
          quantity: quantityInt,
          totalAmount: totalAmount,
          reference: reference,
          orderId: order.id,
        }),
      },
    });

    // Send order emails
    if (user) {
      const customerName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Customer";
      
      // Send receipt to customer
      sendOrderReceiptEmail({
        id: order.orderNumber,
        customerEmail: user.email,
        customerName,
        items: [{ name: product.title, quantity: quantityInt, price: totalAmount }],
        total: totalAmount,
        paymentMethod: "Paystack",
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState,
        shippingPostalCode: order.shippingPostalCode,
        shippingCountry: order.shippingCountry,
      }).catch(console.error);
      
      // Notify support
      sendOrderNotificationToSupport({
        id: order.orderNumber,
        customerName,
        customerEmail: user.email,
        total: totalAmount,
        items: [{ name: product.title, quantity: quantityInt }],
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState,
        shippingPostalCode: order.shippingPostalCode,
        shippingCountry: order.shippingCountry,
      }).catch(console.error);
    }

    // Note: revalidatePath is handled by the calling page, not here
    // to avoid errors when called during render

    return { success: true, order };
  } catch (error) {
    console.error("Product payment processing error:", error);
    return { error: "Failed to process product payment" };
  }
}

// Initialize payment for redirect flow
export async function initializePayment(data: {
  type: "subscription" | "product";
  email: string;
  amount: number;
  reference: string;
  itemId: string; // planId or productId
  quantity?: number;
  customizationData?: string;
  callbackUrl: string;
  userId?: string; // Optional userId for direct initialization (e.g. from registration)
}) {
  let userId = data.userId;
  
  if (!userId) {
      const session = await auth();
      userId = session?.user?.id;
  }

  if (!userId) return { error: "Unauthorized" };

  try {
    const { initializePaystackTransaction } = await import("@/lib/paystack");
    
    const result = await initializePaystackTransaction({
      email: data.email,
      amount: data.amount,
      reference: data.reference,
      callbackUrl: data.callbackUrl,
      metadata: {
        type: data.type,
        userId: userId,
        itemId: data.itemId,
        quantity: data.quantity || 1,
        customizationData: data.customizationData,
      },
    });

    if (!result.success) {
      return { error: result.error || "Failed to initialize payment" };
    }

    return { success: true, authorizationUrl: result.authorizationUrl };
  } catch (error) {
    console.error("Payment initialization error:", error);
    return { error: "Failed to initialize payment" };
  }
}
