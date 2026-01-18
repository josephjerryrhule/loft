import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { getAppUrl } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/auth/login?error=Invalid verification link", getAppUrl())
      );
    }

    // Hash the token to match what's stored in the database
    const hashedToken = createHash("sha256").update(token).digest("hex");

    // Find the verification token
    const verificationToken = await prisma.emailVerificationToken.findFirst({
      where: { hashedToken },
      include: { user: true },
    });

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL("/auth/login?error=Invalid or expired verification link", getAppUrl())
      );
    }

    // Check if token has expired
    if (verificationToken.expiresAt < new Date()) {
      return NextResponse.redirect(
        new URL("/auth/login?error=Verification link has expired", getAppUrl())
      );
    }

    // Check if already verified
    if (verificationToken.verifiedAt) {
      return NextResponse.redirect(
        new URL("/auth/login?error=Email already verified", getAppUrl())
      );
    }

    // Mark user as verified
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { isEmailVerified: true },
    });

    // Mark token as used
    await prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { verifiedAt: new Date() },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: verificationToken.userId,
        actionType: "EMAIL_VERIFIED",
        actionDetails: JSON.stringify({ method: "email_link" }),
      },
    });

    // Redirect to login with success message
    return NextResponse.redirect(
      new URL("/auth/login?verified=true", getAppUrl())
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(
      new URL("/auth/login?error=An error occurred during verification", getAppUrl())
    );
  }
}
