"use server";

import { z } from "zod";
import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@/lib/types";
import { processSignupCommission } from "@/lib/commission";
import { sendPasswordResetEmail, sendWelcomeEmail, sendAffiliateWelcomeEmail, sendAffiliateJoinedManagerEmail } from "@/lib/email";
import { randomBytes } from "crypto";

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.nativeEnum(Role),
  managerCode: z.string().optional(), // For affiliates
  referralCode: z.string().optional(), // For customers
});

export async function registerUser(formData: z.infer<typeof registerSchema>) {
  const { firstName, lastName, email, password, phone, role, managerCode, referralCode } = formData;

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
      },
    });

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

    return { success: true };
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
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Create the reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
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
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
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
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
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

