"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@/lib/types";
import { processSignupCommission } from "@/lib/commission";

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

    return { success: true };
  } catch (e) {
      console.error(e);
      return { error: "Failed to create user." };
  }
}

