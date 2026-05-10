"use server";

import { prisma } from "@/lib/prisma";
import { sendChildOtpEmail } from "@/lib/email";
import { setChildSession, clearChildSession } from "@/lib/child-auth";
import crypto from "crypto";

// Request OTP
export async function requestChildOtp(username: string) {
  try {
    const child = await prisma.childProfile.findUnique({
      where: { username },
      include: {
        parent: true,
      },
    });

    if (!child) {
      return { error: "Child profile not found." };
    }

    if (!child.parent?.email) {
      return { error: "Parent email not found." };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry to 15 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Save token to database
    await prisma.childLoginToken.create({
      data: {
        token: otp,
        childId: child.id,
        expiresAt,
      },
    });

    // Send email
    await sendChildOtpEmail({
      email: child.parent.email,
      childName: child.name,
      otp,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to request OTP:", error);
    return { error: "An error occurred while requesting OTP." };
  }
}

// Verify OTP
export async function verifyChildOtp(username: string, otp: string) {
  try {
    const child = await prisma.childProfile.findUnique({
      where: { username },
    });

    if (!child) {
      return { error: "Child profile not found." };
    }

    // Find valid token
    const loginToken = await prisma.childLoginToken.findFirst({
      where: {
        childId: child.id,
        token: otp,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!loginToken) {
      return { error: "Invalid or expired OTP." };
    }

    // Delete used token (and any other expired tokens for this child to clean up)
    await prisma.childLoginToken.deleteMany({
      where: {
        childId: child.id,
        OR: [
          { id: loginToken.id },
          { expiresAt: { lt: new Date() } }
        ]
      },
    });

    // Set child session
    await setChildSession(child.id, child.username!, child.parentId);

    return { success: true };
  } catch (error) {
    console.error("Failed to verify OTP:", error);
    return { error: "An error occurred while verifying OTP." };
  }
}

export async function logoutChild() {
  await clearChildSession();
  return { success: true };
}

export async function parentLoginAsChild(childId: string) {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    const child = await prisma.childProfile.findUnique({
      where: { id: childId },
    });

    if (!child) {
      return { error: "Child profile not found." };
    }

    if (child.parentId !== session.user.id) {
      return { error: "Unauthorized. You are not the parent of this child." };
    }

    // Set child session
    await setChildSession(child.id, child.username!, child.parentId);

    return { success: true };
  } catch (error) {
    console.error("Failed to login as child:", error);
    return { error: "An error occurred while logging in." };
  }
}
