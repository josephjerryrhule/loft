import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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
          
          // Check if user is suspended or banned
          if (user.status === "SUSPENDED" || user.status === "BANNED") {
            console.log(`Login blocked: User ${email} is ${user.status}`);
            return null;
          }
          
          const passwordsMatch = await compare(password, user.passwordHash);
          
          if (passwordsMatch) return user;
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
