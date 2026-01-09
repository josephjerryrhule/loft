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
