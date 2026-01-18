import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ACCOUNT_LOCKOUT_THRESHOLD = 5; // Lock account after 5 failed attempts
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

async function getUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

async function handleFailedLogin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { failedLoginAttempts: true },
  });

  const newAttempts = (user?.failedLoginAttempts || 0) + 1;
  const lockedUntil = newAttempts >= ACCOUNT_LOCKOUT_THRESHOLD
    ? new Date(Date.now() + LOCKOUT_DURATION)
    : null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: newAttempts,
      lastFailedLogin: new Date(),
      lockedUntil,
    },
  });
}

async function resetFailedLoginAttempts(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lastFailedLogin: null,
      lockedUntil: null,
    },
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      async authorize(credentials) {
        // 1. Check for payment-based auto-login (no password required)
        const paymentAuth = z.object({ paymentReference: z.string() }).safeParse(credentials);
        
        if (paymentAuth.success) {
            const { paymentReference } = paymentAuth.data;
            
            // Find subscription with this reference
            // Must be recent (e.g., within 20 mins) to prevent reuse/replay attacks
            // and must be COMPLETED/ACTIVE status
            const subscription = await prisma.subscription.findFirst({
                where: {
                    paymentReference: paymentReference,
                    paymentStatus: "COMPLETED",
                    createdAt: {
                        gte: new Date(Date.now() - 20 * 60 * 1000) // 20 mins ago
                    }
                },
                include: { customer: true }
            });

            if (subscription && subscription.customer) {
                const user = subscription.customer;
                // Double check user status
                if (user.status === "SUSPENDED" || user.status === "BANNED") return null;
                
                return user;
            }
            // If not found or invalid, fall through to normal login? 
            // Better to return null strictly if paymentReference was intended but failed.
            return null; 
        }

        // 2. Normal Email/Password Login
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email.toLowerCase());
          if (!user) return null;
          
          // Check if account is locked
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            return null;
          }
          
          // Check if user is suspended or banned
          if (user.status === "SUSPENDED" || user.status === "BANNED") {
            return null;
          }

          // Check if email is verified (skip for ADMIN users)
          if (user.role !== "ADMIN" && !user.isEmailVerified) {
            return null;
          }
          
          const passwordsMatch = await compare(password, user.passwordHash);
          
          if (passwordsMatch) {
            // Reset failed login attempts on successful login
            await resetFailedLoginAttempts(user.id);
            return user;
          } else {
            // Track failed login attempt
            await handleFailedLogin(user.id);
            return null;
          }
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async session({ session, token }) {
        if (token.sub && session.user) {
            session.user.id = token.sub;
            // Fetch role from db since it might change
            const user = await prisma.user.findUnique({ where: { id: token.sub } });
            if (user) {
                // Check if user is suspended/banned and invalidate session
                if (user.status === "SUSPENDED" || user.status === "BANNED") {
                    // Return empty session to force logout
                    return { ...session, user: undefined };
                }
                // @ts-ignore
                session.user.role = user.role;
                // @ts-ignore
                session.user.requirePasswordReset = user.requirePasswordReset;
            }
        }
        return session;
    },
    async jwt({ token }) {
        return token;
    }
  },
  events: {
      async signIn({ user }) {
          if (user.id) {
              const { logActivity, ActionType } = await import("@/lib/logger");
              await logActivity(user.id, ActionType.LOGIN, "User logged in");
          }
      }
  }
});
