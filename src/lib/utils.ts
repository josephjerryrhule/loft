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
    LITTLE_LOFTERS: "Little Lofters (0-3 years)",
    LOFT_365: "Loft 365 Readers (4-7 years)",
    BIG_READERS: "Big Readers (8+ years)",
    // Support legacy or alternative names
    TODDLER: "Little Lofters (0-3 years)",
    EARLY_READER: "Loft 365 Readers (4-7 years)",
    INTERMEDIATE: "Big Readers (8+ years)",
    ADVANCED: "Advanced Readers (12+ years)",
  };
  return labels[normalized] || ageGroup.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}
