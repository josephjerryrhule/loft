"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { processSubscriptionCommission } from "@/lib/commission";
import { getPaystackSecretKey } from "@/lib/paystack";
import { revalidatePath } from "next/cache";
import { 
  sendSubscriptionConfirmationEmail, 
  sendSubscriptionReceiptEmail,
  sendOrderReceiptEmail,
  sendOrderNotificationToSupport
} from "@/lib/email";
import { canCreateSubscriptionForProfile } from "@/lib/access-control.mjs";

// Verify payment with Paystack
interface PaystackVerificationData {
  amount: number;
  reference: string;
  status: string;
  metadata?: {
      userId?: string;
      type?: string;
      itemId?: string;
      [key: string]: unknown;
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

  // 2. Determine Customer ID and Child Profile ID
  let customerId = userId;
  let childProfileId: string | undefined = undefined;
  
  // If not passed, check metadata
  if (verificationData?.metadata) {
    if (!customerId && verificationData.metadata.userId) {
        customerId = verificationData.metadata.userId;
    }
    if (typeof verificationData.metadata.childProfileId === "string" && verificationData.metadata.childProfileId.trim() !== "") {
        childProfileId = verificationData.metadata.childProfileId;
    }
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
        if (typeof verificationData.metadata?.childProfileId === "string" && verificationData.metadata.childProfileId.trim() !== "" && !childProfileId) {
            childProfileId = verificationData.metadata.childProfileId;
        }
    }

    // Resolve planId — fall back to metadata if not explicitly provided
    let resolvedPlanId = planId;
    if (!resolvedPlanId && verificationData?.metadata) {
        resolvedPlanId =
          typeof verificationData.metadata.planId === "string"
            ? verificationData.metadata.planId
            : typeof verificationData.metadata.itemId === "string"
            ? verificationData.metadata.itemId
            : "";
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: resolvedPlanId },
    });

    if (!plan) return { error: "Plan not found" };

    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: { id: true, role: true },
    });

    if (!customer) return { error: "Customer not found" };
    if (!canCreateSubscriptionForProfile(customer.role, childProfileId)) {
      return { error: "This account cannot subscribe to that profile" };
    }

    if (childProfileId) {
      const child = await prisma.childProfile.findFirst({
        where: { id: childProfileId, parentId: customerId },
        select: { id: true },
      });
      if (!child) return { error: "Invalid child profile" };
    }

    // Prevent duplicate processing
    const existingSubscription = await prisma.subscription.findFirst({
      where: { paymentReference: reference },
      include: { customer: true }
    });
    if (existingSubscription) {
      return { success: true, subscription: existingSubscription };
    }

    // Verify amount matches
    const amountPaid = verificationData.amount / 100; // Convert from pesewas to GHS
    if (amountPaid < Number(plan.price)) {
      return { error: "Payment amount mismatch" };
    }

    // Calculate subscription dates (start: now, end: now + duration days)
    const startDate = new Date();
    const endDate = new Date(startDate.getTime());
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // Cancel any existing active subscriptions for this specific child (or the parent if no child specified, for backwards compatibility)
    await prisma.subscription.updateMany({
      where: {
        customerId: customerId,
        childProfileId: childProfileId || null,
        status: "ACTIVE",
      },
      data: { status: "CANCELLED" },
    });

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        customerId: customerId,
        childProfileId: childProfileId,
        planId: resolvedPlanId,
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

    // NOTE: revalidatePath is intentionally NOT called here.
    // This function runs inside the /payment/callback render, and calling
    // revalidatePath during rendering throws a Next.js error.
    // The parent dashboard uses noStore() + router.refresh() to get fresh data.

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
    customizationData?: any, 
    customerUploadUrl?: string,
    skipRevalidate: boolean = false,
    userId?: string
) {

  let finalUserId = userId;
  if (!finalUserId) {
    const session = await auth();
    finalUserId = session?.user?.id;
  }
  
  if (!finalUserId) return { error: "Unauthorized" };

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

    // Prevent duplicate processing
    const existingOrder = await prisma.order.findFirst({
      where: { paymentReference: reference }
    });
    if (existingOrder) {
      return { success: true, order: existingOrder };
    }

    const totalAmount = Number(product.price) * quantityInt;
    const amountPaid = verification.data.amount / 100; // Convert from pesewas to GHS

    // Verify amount matches
    if (amountPaid < totalAmount) {
      return { error: "Payment amount mismatch" };
    }

    // Get user's referrer and address for commission and shipping
    const user = await prisma.user.findUnique({
      where: { id: finalUserId },
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
        customerId: finalUserId,
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
        userId: finalUserId,
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

    // Invalidate caches
    if (!skipRevalidate) {
      revalidatePath("/parent/orders");
      revalidatePath("/customer/orders");
    }

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
  customerUploadUrl?: string;
  callbackUrl: string;
  userId?: string; // Optional userId for direct initialization (e.g. from registration)
  childProfileId?: string; // Optional childProfileId for child subscriptions
  gateway?: string; // "PAYSTACK" | "STRIPE" | "PAYPAL"
  currency?: string; // "GHS" | "USD" | "EUR" | "GBP"
}) {
  let userId = data.userId;
  const gateway = data.gateway || "PAYSTACK";
  const currency = data.currency || "GHS";
  
  if (!userId) {
      const session = await auth();
      userId = session?.user?.id;
  }

  if (!userId) return { error: "Unauthorized" };

  try {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: data.itemId },
    });

    if (data.type === "subscription") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) return { error: "User not found" };
      if (!canCreateSubscriptionForProfile(user.role, data.childProfileId)) {
        return { error: "This account cannot subscribe to that profile" };
      }

      if (data.childProfileId) {
        const child = await prisma.childProfile.findFirst({
          where: { id: data.childProfileId, parentId: userId },
          select: { id: true },
        });
        if (!child) return { error: "Invalid child profile" };
      }
    }

    if (gateway === "STRIPE") {
      if (!plan) return { error: "Plan not found" };
      const { getStripeInstance } = await import("@/lib/stripe");
      const stripe = await getStripeInstance();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: plan.name,
                description: plan.description || undefined,
              },
              unit_amount: Math.round(data.amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${data.callbackUrl}?gateway=stripe&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${data.callbackUrl.replace("/payment/callback", "/parent/plans")}?error=cancelled`,
        metadata: {
          type: "subscription",
          userId: userId,
          itemId: plan.id,
          childProfileId: data.childProfileId && data.childProfileId.trim() !== "" ? data.childProfileId : null,
        },
      });
      return { success: true, authorizationUrl: session.url };
    }

    if (gateway === "PAYPAL") {
      if (!plan) return { error: "Plan not found" };
      const { createPaypalOrder } = await import("@/lib/paypal");
      const customId = JSON.stringify({
        userId,
        planId: plan.id,
        childProfileId: data.childProfileId && data.childProfileId.trim() !== "" ? data.childProfileId : undefined,
      });

      const order = await createPaypalOrder({
        amount: data.amount,
        currency: currency,
        reference: data.reference,
        customId: customId,
        returnUrl: `${data.callbackUrl}?gateway=paypal`,
        cancelUrl: `${data.callbackUrl.replace("/payment/callback", "/parent/plans")}?error=cancelled`,
      });

      const approveUrl = order.links?.find((l: any) => l.rel === "approve" || l.rel === "payer-action")?.href;
      if (!approveUrl) {
        return { error: "PayPal approval link not found" };
      }

      return { success: true, authorizationUrl: approveUrl };
    }

    // Default to Paystack
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
        childProfileId: data.childProfileId && data.childProfileId.trim() !== "" ? data.childProfileId : undefined,
        quantity: data.quantity || 1,
        customizationData: data.customizationData,
        customerUploadUrl: data.customerUploadUrl,
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

export async function processStripeSubscriptionPayment(sessionId: string) {
  try {
    const { getStripeInstance } = await import("@/lib/stripe");
    const stripe = await getStripeInstance();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return { error: "Stripe payment not completed" };
    }

    const metadata = session.metadata || {};
    const type = metadata.type;
    const planId = metadata.itemId || metadata.planId;
    const customerId = metadata.userId;
    const childProfileId = metadata.childProfileId && metadata.childProfileId.trim() !== "" ? metadata.childProfileId : null;

    if (type !== "subscription" || !planId || !customerId) {
      return { error: "Invalid Stripe metadata" };
    }

    const existingSubscription = await prisma.subscription.findFirst({
      where: { paymentReference: sessionId },
      include: { customer: true }
    });

    if (existingSubscription) {
      return { success: true, subscription: existingSubscription };
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) return { error: "Plan not found" };

    const startDate = new Date();
    const endDate = new Date(startDate.getTime());
    endDate.setDate(endDate.getDate() + plan.durationDays);

    await prisma.subscription.updateMany({
      where: {
        customerId: customerId,
        childProfileId: childProfileId,
        status: "ACTIVE",
      },
      data: { status: "CANCELLED" },
    });

    const currency = (session.currency || "USD").toUpperCase();
    const amountPaid = (session.amount_total || 0) / 100;

    const subscription = await prisma.subscription.create({
      data: {
        customerId,
        childProfileId,
        planId,
        status: "ACTIVE",
        paymentStatus: "COMPLETED",
        paymentReference: sessionId,
        gateway: "STRIPE",
        currency,
        startDate,
        endDate,
        autoRenew: false,
      },
      include: { customer: true }
    });

    await prisma.user.update({
      where: { id: customerId },
      data: { isEmailVerified: true }
    });

    await processSubscriptionCommission(
      subscription.id,
      customerId,
      amountPaid
    );

    await prisma.activityLog.create({
      data: {
        userId: customerId,
        actionType: "SUBSCRIPTION",
        actionDetails: JSON.stringify({
          planName: plan.name,
          amount: amountPaid,
          currency: currency,
          reference: sessionId,
          subscriptionId: subscription.id,
          gateway: "STRIPE"
        }),
      },
    });

    if (subscription.customer) {
      const userName = `${subscription.customer.firstName || ""} ${subscription.customer.lastName || ""}`.trim() || "Customer";
      const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
      
      sendSubscriptionConfirmationEmail({
        userEmail: subscription.customer.email,
        userName,
        planName: plan.name,
        amount: `${symbol}${amountPaid.toFixed(2)}` as any,
        startDate,
        endDate,
      }).catch(console.error);
      
      sendSubscriptionReceiptEmail({
        userEmail: subscription.customer.email,
        userName,
        planName: plan.name,
        amount: `${symbol}${amountPaid.toFixed(2)}` as any,
        transactionId: sessionId,
        billingPeriod: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      }).catch(console.error);
    }

    return { success: true, subscription };
  } catch (error) {
    console.error("Stripe payment processing error:", error);
    return { error: "Failed to process Stripe subscription payment" };
  }
}

export async function processPaypalSubscriptionPayment(orderId: string) {
  try {
    const { capturePaypalOrder } = await import("@/lib/paypal");
    const captureResult = await capturePaypalOrder(orderId);

    if (captureResult.status !== "COMPLETED") {
      return { error: "PayPal payment is not completed" };
    }

    const purchaseUnit = captureResult.purchase_units?.[0];
    const customId = purchaseUnit?.custom_id;

    if (!customId) {
      return { error: "Missing customId in PayPal payment" };
    }

    const { userId, planId, childProfileId } = JSON.parse(customId);

    if (!userId || !planId) {
      return { error: "Invalid metadata in PayPal payment" };
    }

    const existingSubscription = await prisma.subscription.findFirst({
      where: { paymentReference: orderId },
      include: { customer: true }
    });

    if (existingSubscription) {
      return { success: true, subscription: existingSubscription };
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) return { error: "Plan not found" };

    const startDate = new Date();
    const endDate = new Date(startDate.getTime());
    endDate.setDate(endDate.getDate() + plan.durationDays);

    await prisma.subscription.updateMany({
      where: {
        customerId: userId,
        childProfileId: childProfileId || null,
        status: "ACTIVE",
      },
      data: { status: "CANCELLED" },
    });

    const amountPaid = parseFloat(purchaseUnit?.payments?.captures?.[0]?.amount?.value || "0");
    const currency = (purchaseUnit?.payments?.captures?.[0]?.amount?.currency_code || "USD").toUpperCase();

    const subscription = await prisma.subscription.create({
      data: {
        customerId: userId,
        childProfileId: childProfileId || null,
        planId: planId,
        status: "ACTIVE",
        paymentStatus: "COMPLETED",
        paymentReference: orderId,
        gateway: "PAYPAL",
        currency,
        startDate,
        endDate,
        autoRenew: false,
      },
      include: { customer: true }
    });

    await prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true }
    });

    await processSubscriptionCommission(
      subscription.id,
      userId,
      amountPaid
    );

    await prisma.activityLog.create({
      data: {
        userId,
        actionType: "SUBSCRIPTION",
        actionDetails: JSON.stringify({
          planName: plan.name,
          amount: amountPaid,
          currency: currency,
          reference: orderId,
          subscriptionId: subscription.id,
          gateway: "PAYPAL"
        }),
      },
    });

    if (subscription.customer) {
      const userName = `${subscription.customer.firstName || ""} ${subscription.customer.lastName || ""}`.trim() || "Customer";
      const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
      
      sendSubscriptionConfirmationEmail({
        userEmail: subscription.customer.email,
        userName,
        planName: plan.name,
        amount: `${symbol}${amountPaid.toFixed(2)}` as any,
        startDate,
        endDate,
      }).catch(console.error);
      
      sendSubscriptionReceiptEmail({
        userEmail: subscription.customer.email,
        userName,
        planName: plan.name,
        amount: `${symbol}${amountPaid.toFixed(2)}` as any,
        transactionId: orderId,
        billingPeriod: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      }).catch(console.error);
    }

    return { success: true, subscription };
  } catch (error) {
    console.error("PayPal payment processing error:", error);
    return { error: "Failed to process PayPal subscription payment" };
  }
}
