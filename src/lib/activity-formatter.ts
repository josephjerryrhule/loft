// Utility functions for formatting activity details

export function formatActivityDetails(actionType: string, detailsJson: string): string {
  try {
    const details = JSON.parse(detailsJson);
    
    switch (actionType) {
      case "SUBSCRIPTION":
        return `Subscribed to ${details.planName || "a plan"} for GHS ${details.amount?.toFixed(2) || "0.00"}`;
      
      case "CREATE_ORDER":
        return `Purchased ${details.productTitle || "a product"} ${details.quantity > 1 ? `(${details.quantity}x)` : ""} for GHS ${details.totalAmount?.toFixed(2) || "0.00"}`;
      
      case "COMMISSION_APPROVED":
        return `Commission of GHS ${details.amount?.toFixed(2) || "0.00"} approved`;
      
      case "COMMISSION_EARNED":
        return `Earned GHS ${details.amount?.toFixed(2) || "0.00"} commission from ${details.sourceType || "activity"}`;
      
      case "PAYOUT_REQUESTED":
        return `Requested payout of GHS ${details.amount?.toFixed(2) || "0.00"} via ${details.paymentMethod || "payment method"}`;
      
      case "PAYOUT_RECEIVED":
        return `Received payout of GHS ${details.amount?.toFixed(2) || "0.00"}`;
      
      case "PAYMENT_RECEIVED":
        return `Payment received (GHS ${(details.amount / 100)?.toFixed(2) || "0.00"}) - ${details.type || "transaction"}`;
      
      case "USER_CREATED":
        return `New ${details.role || "user"} account created: ${details.name || ""}`;
      
      case "USER_UPDATED":
        return `Profile updated for ${details.name || "user"}`;
      
      case "REFERRAL":
        return `${details.referredName || "Someone"} signed up using referral link`;
      
      default:
        // For any unknown types, try to show a formatted version
        if (details.amount) {
          return `Transaction: GHS ${details.amount?.toFixed(2) || "0.00"}`;
        }
        if (details.message) {
          return details.message;
        }
        // Last resort: show the raw JSON in a readable way
        return Object.entries(details)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");
    }
  } catch {
    // If JSON parsing fails, return the raw string
    return detailsJson || "No details available";
  }
}

export function getActionTypeLabel(actionType: string): string {
  const labels: Record<string, string> = {
    SUBSCRIPTION: "Subscription",
    CREATE_ORDER: "Product Purchase",
    COMMISSION_APPROVED: "Commission Approved",
    COMMISSION_EARNED: "Commission Earned",
    PAYOUT_REQUESTED: "Payout Requested",
    PAYOUT_RECEIVED: "Payout Received",
    PAYMENT_RECEIVED: "Payment Received",
    USER_CREATED: "User Created",
    USER_UPDATED: "User Updated",
    REFERRAL: "Referral",
  };
  
  return labels[actionType] || actionType.replace(/_/g, " ");
}
