"use server";

import { z } from "zod";
import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@/lib/types";
import { processSignupCommission } from "@/lib/commission";
import { sendPasswordResetEmail, sendWelcomeEmail, sendAffiliateWelcomeEmail, sendAffiliateJoinedManagerEmail, sendEmailVerification } from "@/lib/email";
import { randomBytes, createHash } from "crypto";

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.nativeEnum(Role),
  managerCode: z.string().optional(), // For affiliates
  referralCode: z.string().optional(), // For customers
  isAdminCreated: z.boolean().optional(), // Flag for admin-created users
  // Address fields
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

export async function registerUser(formData: z.infer<typeof registerSchema>) {
  const { firstName, lastName, email, password, phone, role, managerCode, referralCode, isAdminCreated, address, city, state, postalCode, country } = formData;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "User already exists with this email." };
  }

  const hashedPassword = await hash(password, 10);

  let managerId = null;
  let referredById = null;

  if (role === Role.AFFILIATE && managerCode) {
    const manager = await prisma.user.findUnique({
      where: { inviteCode: managerCode },
    });
    if (!manager) return { error: "Invalid Manager Invite Code" };
    managerId = manager.id;
  }

  if (role === Role.CUSTOMER && referralCode) {
    // Referral code could be invite code of manager or affiliate
    const referrer = await prisma.user.findUnique({
        where: { inviteCode: referralCode }
    });
    if (referrer) referredById = referrer.id;
  }

  // Generate invite code for Managers and Affiliates
  let newInviteCode = null;
  if (role === Role.MANAGER || role === Role.AFFILIATE) {
      newInviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  try {
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash: hashedPassword,
        phoneNumber: phone || "",
        role,
        managerId,
        referredById,
        inviteCode: newInviteCode,
        requirePasswordReset: isAdminCreated || false, // Force password reset for admin-created users
        address: address || null,
        city: city || null,
        state: state || null,
        postalCode: postalCode || null,
        country: country || null,
      },
    });

    // Assign free plan to new customers
    if (role === Role.CUSTOMER) {
      // Use the seeded free plan (created by prisma/seed.ts)
      const freePlan = await prisma.subscriptionPlan.findUnique({
        where: { id: "free-plan-default" }
      });

      if (!freePlan) {
        throw new Error("Free plan not found. Please run: npx prisma db seed");
      }

      // Create free subscription for the customer
      // Calculate free subscription dates (start: now, end: now + duration days)
      const freeStartDate = new Date();
      const freeEndDate = new Date(freeStartDate.getTime());
      freeEndDate.setDate(freeEndDate.getDate() + freePlan.durationDays);

      await prisma.subscription.create({
        data: {
          customerId: newUser.id,
          planId: freePlan.id,
          status: "ACTIVE",
          startDate: freeStartDate,
          endDate: freeEndDate,
          autoRenew: false
        }
      });
    }

    // Process signup commission if customer was referred
    if (role === Role.CUSTOMER && referralCode) {
      await processSignupCommission(newUser.id, referralCode);
    }

    // Send welcome email
    sendWelcomeEmail({
      email: newUser.email,
      firstName: newUser.firstName || "User",
      role: newUser.role,
    }).catch(console.error);

    // Send affiliate-specific emails
    if (role === Role.AFFILIATE && managerId) {
      const manager = await prisma.user.findUnique({ where: { id: managerId } });
      if (manager) {
        // Notify affiliate
        sendAffiliateWelcomeEmail({
          affiliateEmail: newUser.email,
          affiliateName: `${newUser.firstName} ${newUser.lastName}`,
          managerName: `${manager.firstName} ${manager.lastName}`,
        }).catch(console.error);

        // Notify manager
        sendAffiliateJoinedManagerEmail({
          managerEmail: manager.email,
          managerName: manager.firstName || "Manager",
          affiliateName: `${newUser.firstName} ${newUser.lastName}`,
          affiliateEmail: newUser.email,
        }).catch(console.error);
      }
    }

    // Create email verification token
    const verificationToken = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(verificationToken).digest("hex");
    const verificationUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/verify-email?token=${verificationToken}`;

    await prisma.emailVerificationToken.create({
      data: {
        userId: newUser.id,
        token: verificationToken,
        hashedToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send verification email
    sendEmailVerification({
      userEmail: newUser.email,
      verificationUrl,
    }).catch(console.error);

    return { success: true, message: "Registration successful! Please check your email to verify your account." };
  } catch (e) {
      console.error(e);
      return { error: "Failed to create user." };
  }
}

import { auth } from "@/auth";

export async function getSession() {
    const session = await auth();
    return session;
}

// Password Reset Functions

export async function requestPasswordReset(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true };
    }

    // Delete any existing tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate a secure token
    const token = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Create the reset token with hashed version
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        hashedToken,
        expiresAt,
      },
    });

    // Send the password reset email
    await sendPasswordResetEmail({
      userEmail: user.email,
      userName: user.firstName || "User",
      resetToken: token,
    });

    return { success: true };
  } catch (error) {
    console.error("Password reset request error:", error);
    return { error: "Failed to process request. Please try again." };
  }
}

export async function validateResetToken(token: string) {
  try {
    const hashedToken = createHash("sha256").update(token).digest("hex");
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { hashedToken },
      include: { user: true },
    });

    if (!resetToken) {
      return { valid: false, error: "Invalid reset token" };
    }

    if (resetToken.usedAt) {
      return { valid: false, error: "This reset link has already been used" };
    }

    if (resetToken.expiresAt < new Date()) {
      return { valid: false, error: "This reset link has expired" };
    }

    return { valid: true };
  } catch (error) {
    console.error("Token validation error:", error);
    return { valid: false, error: "Failed to validate token" };
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    const hashedToken = createHash("sha256").update(token).digest("hex");
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { hashedToken },
      include: { user: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return { error: "Invalid or expired reset token" };
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 10);

    // Update the user's password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: hashedPassword },
    });

    // Mark the token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: resetToken.userId,
        actionType: "PASSWORD_RESET",
        actionDetails: JSON.stringify({ method: "email_reset" }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { error: "Failed to reset password. Please try again." };
  }
}

export async function resendEmailVerification(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: "User not found" };
    }

    if (user.isEmailVerified) {
      return { error: "Email is already verified" };
    }

    // Delete any existing unused verification tokens for this user
    await prisma.emailVerificationToken.deleteMany({
      where: {
        userId: user.id,
        verifiedAt: null,
      },
    });

    // Generate new verification token
    const token = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        hashedToken,
        expiresAt,
      },
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/verify-email?token=${token}`;
    await sendEmailVerification({
      userEmail: user.email,
      verificationUrl,
    });

    return { success: true };
  } catch (error) {
    console.error("Resend verification error:", error);
    return { error: "Failed to resend verification email. Please try again." };
  }
}

export async function checkLoginStatus(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: "INVALID_CREDENTIALS" };
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return { 
        error: "ACCOUNT_LOCKED", 
        lockedUntil: user.lockedUntil.toISOString() 
      };
    }

    // Check if user is suspended or banned
    if (user.status === "SUSPENDED" || user.status === "BANNED") {
      return { error: "ACCOUNT_SUSPENDED", status: user.status };
    }

    // Check password first
    const passwordsMatch = await compare(password, user.passwordHash);
    if (!passwordsMatch) {
      return { error: "INVALID_CREDENTIALS" };
    }

    // Then check email verification (skip for ADMIN)
    if (user.role !== "ADMIN" && !user.isEmailVerified) {
      return { error: "EMAIL_NOT_VERIFIED", email: user.email };
    }

    return { success: true };
  } catch (error) {
    console.error("Check login status error:", error);
    return { error: "UNKNOWN_ERROR" };
  }
}

export async function updateUserPassword(newPassword: string) {
  const { auth } = await import("@/auth");
  const session = await auth();
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  try {
    const hashedPassword = await hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        passwordHash: hashedPassword,
        requirePasswordReset: false,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Update password error:", error);
    return { error: "Failed to update password" };
  }
}
