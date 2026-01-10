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
      where: { email },
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
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          
          // Check if account is locked
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            console.log(`Login blocked: User ${email} is locked until ${user.lockedUntil}`);
            return null;
          }
          
          // Check if user is suspended or banned
          if (user.status === "SUSPENDED" || user.status === "BANNED") {
            console.log(`Login blocked: User ${email} is ${user.status}`);
            return null;
          }

          // Check if email is verified (skip for ADMIN users)
          if (user.role !== "ADMIN" && !user.isEmailVerified) {
            console.log(`Login blocked: User ${email} has not verified their email`);
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
            console.log(`Invalid credentials for ${email}. Failed attempts incremented.`);
            return null;
          }
        }

        console.log("Invalid credentials");
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
