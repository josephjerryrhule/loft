"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// Keys safe to expose to any caller (branding, public flags, public Paystack keys).
// Anything not in this list is treated as secret and only returned to admins.
const PUBLIC_SETTING_KEYS = new Set([
    "platformName",
    "websiteTitle",
    "metaDescription",
    "supportEmail",
    "currency",
    "logoUrl",
    "faviconUrl",
    "paystackMode",
    "paystackTestPublicKey",
    "paystackLivePublicKey",
    "leaderboardVisible",
    "minimumPayoutAmount",
    "globalPaidPlanReferralRate",
    "operationsManagerOverrideRate",
    "managerOverrideRate",
    "teamLeaderOverrideRate",
    "managerCommissionPercentage",
]);

async function fetchSettingsMap(): Promise<Record<string, any>> {
    const settings = await prisma.systemSettings.findMany();
    const settingsMap: Record<string, any> = {};
    settings.forEach(s => {
        try {
            settingsMap[s.key] = JSON.parse(s.value);
        } catch (e) {
            settingsMap[s.key] = s.value;
        }
    });
    return settingsMap;
}

/**
 * Returns system settings. Admin/operations callers receive everything
 * (including SMTP credentials and Paystack secret keys). All other callers
 * receive only the whitelisted public-safe keys.
 */
export async function getSystemSettings() {
    try {
        const full = await fetchSettingsMap();
        const session = await auth();
        const role = (session?.user as any)?.role;
        const isPrivileged = role === "ADMIN" || role === "OPERATIONS_MANAGER";
        if (isPrivileged) return full;

        const publicMap: Record<string, any> = {};
        for (const key of Object.keys(full)) {
            if (PUBLIC_SETTING_KEYS.has(key)) publicMap[key] = full[key];
        }
        return publicMap;
    } catch (error) {
        console.error("Failed to fetch system settings:", error);
        return {};
    }
}

/**
 * Server-only accessor that always returns the full settings map (including
 * secrets). Use only from trusted server contexts that need SMTP creds /
 * Paystack secret keys (e.g. lib/email.ts, server-side paystack helpers).
 * Never expose the result through a server-component prop to a client.
 */
export async function getSystemSettingsServerSecret() {
    try {
        return await fetchSettingsMap();
    } catch (error) {
        console.error("Failed to fetch system settings:", error);
        return {};
    }
}

export async function getMinimumPayoutAmount(): Promise<number> {
    try {
        const setting = await prisma.systemSettings.findUnique({
            where: { key: "minimumPayoutAmount" }
        });
        if (setting) {
            return Number(JSON.parse(setting.value));
        }
    } catch (e) {
        console.error("Failed to fetch minimum payout amount:", e);
    }
    return 50; // Default minimum
}

// Settings that store sensitive credentials. If an updateSystemSettings call
// sends an empty/masked value for one of these keys we keep the stored value,
// so admins editing branding don't accidentally wipe SMTP/Paystack secrets.
const SECRET_SETTING_KEYS = new Set([
    "smtpPass",
    "paystackTestSecretKey",
    "paystackLiveSecretKey",
]);

export async function updateSystemSettings(formData: FormData) {
    try {
        const session = await auth();
        const role = (session?.user as any)?.role;
        if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
            return { error: "Unauthorized" };
        }

        const data: Record<string, any> = {};
        for (const [key, value] of formData.entries()) {
            if (key.startsWith("$")) continue;
            data[key] = value;
        }

        const updates = Object.entries(data).map(async ([key, value]) => {
            // Preserve existing secret values when the form submitted a blank
            // (means "keep current") rather than overwriting with empty string.
            if (SECRET_SETTING_KEYS.has(key) && (value === "" || value === null || value === undefined)) {
                return null;
            }
            const valueStr = JSON.stringify(value);
            return prisma.systemSettings.upsert({
                where: { key },
                update: { value: valueStr },
                create: { key, value: valueStr },
            });
        });

        await Promise.all(updates);

        revalidatePath("/admin/settings");
        revalidatePath("/settings");
        return { success: true };
    } catch (error) {
        console.error("Failed to update system settings:", error);
        return { error: "Failed to update settings" };
    }
}

export async function getUserProfile() {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                inviteCode: true,
                role: true,
                status: true
            }
        });
        return user;
    } catch (error) {
        console.error("Failed to get user profile:", error);
        return null;
    }
}
