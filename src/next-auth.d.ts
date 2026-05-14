import { DefaultSession } from "next-auth";
import { Role } from "@/lib/types";

declare module "next-auth" {
  interface User {
    role?: Role | string;
    requirePasswordReset?: boolean;
    status?: string;
  }

  interface Session {
    user: {
      id: string;
      role?: Role | string;
      requirePasswordReset?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role | string;
    requirePasswordReset?: boolean;
  }
}
