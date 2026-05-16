// Utility functions for formatting activity details

export function formatActivityDetails(actionType: string, detailsJson: string): string {
  try {
    const details = JSON.parse(detailsJson);
    
    switch (actionType) {
      case "SUBSCRIPTION":
        return `Joined the ${details.planName || "premium family"} for GHS ${details.amount?.toFixed(2) || "0.00"}`;
      
      case "CREATE_ORDER":
        return `Picked up ${details.productTitle || "a new story"} ${details.quantity > 1 ? `(${details.quantity}x)` : ""} for GHS ${details.totalAmount?.toFixed(2) || "0.00"}`;
      
      case "COMMISSION_APPROVED":
        return `Approved a reward of GHS ${details.amount?.toFixed(2) || "0.00"}`;
      
      case "COMMISSION_EARNED":
        return `Received GHS ${details.amount?.toFixed(2) || "0.00"} from ${details.sourceType === "SUBSCRIPTION" ? "a new family signup" : "a story purchase"}`;
      
      case "PAYOUT_REQUESTED":
        return `Requested a withdrawal of GHS ${details.amount?.toFixed(2) || "0.00"}`;
      
      case "PAYOUT_RECEIVED":
        return `Successfully received a payment of GHS ${details.amount?.toFixed(2) || "0.00"}`;
      
      case "ADMIN_UPDATE_ORDER":
        return `Updated the details for order #${details.orderId?.slice(-6) || "unknown"}`;
      
      case "PAYMENT_RECEIVED":
        return `Successfully processed a payment of GHS ${(details.amount / 100)?.toFixed(2) || "0.00"}`;
      
      case "USER_CREATED":
        return `Welcomed a new ${details.role?.toLowerCase() || "member"}: ${details.name || "Unknown Friend"}`;
      
      case "USER_UPDATED":
        return `Updated personal details for ${details.name || "a member"}`;
      
      case "REFERRAL":
        return `${details.referredName || "A new friend"} joined the adventure through a referral`;
      
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
    ADMIN_UPDATE_ORDER: "Order Updated",
    ADMIN_APPROVE_COMMISSION: "Commission Approved",
  };
  
  return labels[actionType] || actionType.replace(/_/g, " ");
}
