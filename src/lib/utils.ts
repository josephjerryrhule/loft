import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrencySymbol(currencyCode: string = "GHS"): string {
  const symbols: Record<string, string> = {
    "GHS": "₵",
    "NGN": "₦",
    "USD": "$",
    "EUR": "€",
    "GBP": "£",
    "ZAR": "R",
    "KES": "KSh",
  };
  return symbols[currencyCode.toUpperCase()] || currencyCode;
}

export function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function getAgeGroupLabel(ageGroup: string) {
  if (!ageGroup) return "No age group set";
  
  const normalized = ageGroup.toUpperCase().replace(/\s+/g, '_');
  const labels: Record<string, string> = {
    LITTLE_LOFTERS: "Little lofters - 0-3 years",
    LOFT_365: "Loft 365 readers - ages 4-7",
    BIG_READERS: "Big readers - ages 8+",
    // Support legacy or alternative names
    TODDLER: "Little lofters - 0-3 years",
    EARLY_READER: "Loft 365 readers - ages 4-7",
    INTERMEDIATE: "Big readers - ages 8+",
    ADVANCED: "Advanced readers - 12+ years",
  };
  return labels[normalized] || ageGroup.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

export function formatStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  const mapping: Record<string, string> = {
    COMPLETED: "Completed",
    COMPLETED_FREE: "Completed (Free)",
    PENDING: "Pending",
    FAILED: "Failed",
    CANCELLED: "Cancelled",
    PAID: "Paid",
    REFUNDED: "Refunded",
    ACTIVE: "Active",
    EXPIRED: "Expired",
    PROCESSING: "Processing",
    SHIPPED: "Shipped",
    SUSPENDED: "Suspended",
    BANNED: "Banned",
  };
  const key = status.toUpperCase();
  return mapping[key] || status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

