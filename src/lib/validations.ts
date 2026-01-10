import { z } from "zod";
import { Role } from "./types";

// Email validation with additional checks
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .min(5, "Email must be at least 5 characters")
  .max(255, "Email must not exceed 255 characters")
  .toLowerCase()
  .trim()
  .refine(
    (email) => {
      // Check for common typos in popular email domains
      const domain = email.split("@")[1];
      const popularDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];
      const typos = ["gmial.com", "gmai.com", "yahooo.com", "outloo.com"];
      return !typos.includes(domain);
    },
    { message: "Please check your email domain for typos" }
  );

// Password validation with strength requirements
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters")
  .refine((password) => /[a-z]/.test(password), {
    message: "Password must contain at least one lowercase letter",
  })
  .refine((password) => /[A-Z]/.test(password), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((password) => /[0-9]/.test(password), {
    message: "Password must contain at least one number",
  });

// Phone number validation (international format)
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid international phone number (e.g., +1234567890)")
  .optional()
  .or(z.literal(""));

// Name validation
export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must not exceed 50 characters")
  .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
  .trim();

// File upload validation
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 15 * 1024 * 1024, {
      message: "File size must not exceed 15MB",
    })
    .refine(
      (file) => {
        const allowedTypes = [
          "application/pdf",
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
          "text/plain",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        return allowedTypes.includes(file.type);
      },
      {
        message: "File type not supported. Allowed: PDF, images, TXT, DOC, DOCX",
      }
    ),
});

// URL validation
export const urlSchema = z
  .string()
  .url("Invalid URL format")
  .max(2048, "URL must not exceed 2048 characters")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ["http:", "https:"].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: "URL must use HTTP or HTTPS protocol" }
  );

// Currency amount validation
export const currencySchema = z
  .number()
  .positive("Amount must be positive")
  .finite("Amount must be a valid number")
  .refine((num) => Number.isFinite(num) && num > 0, {
    message: "Invalid amount",
  })
  .refine((num) => {
    // Check for reasonable decimal places (max 2 for currency)
    const decimals = (num.toString().split(".")[1] || "").length;
    return decimals <= 2;
  }, {
    message: "Amount can have at most 2 decimal places",
  });

// Sanitize HTML input (remove script tags and dangerous attributes)
export function sanitizeHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
}

// Registration schema with enhanced validation
export const registrationSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  role: z.nativeEnum(Role),
  managerCode: z.string().optional(),
  referralCode: z.string().optional(),
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

// Password reset schema
export const passwordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Profile update schema
export const profileUpdateSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema,
  profilePictureUrl: urlSchema.optional().or(z.literal("")),
});

// Product creation schema
export const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  price: currencySchema,
  fileUrl: urlSchema,
  thumbnailUrl: urlSchema.optional().or(z.literal("")),
  category: z.string().optional(),
});

// Commission rate validation
export const commissionRateSchema = z
  .number()
  .min(0, "Commission rate cannot be negative")
  .max(100, "Commission rate cannot exceed 100%")
  .refine((rate) => {
    const decimals = (rate.toString().split(".")[1] || "").length;
    return decimals <= 2;
  }, {
    message: "Commission rate can have at most 2 decimal places",
  });
