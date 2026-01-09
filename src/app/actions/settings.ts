"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSystemSettings() {
    try {
        const settings = await prisma.systemSettings.findMany();
        // Convert array of {key, value} to object
        const settingsMap: Record<string, any> = {};
        settings.forEach(s => {
            try {
                settingsMap[s.key] = JSON.parse(s.value);
            } catch (e) {
                settingsMap[s.key] = s.value; // Fallback if not JSON
            }
        });
        return settingsMap;
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

export async function updateSystemSettings(formData: FormData) {
    try {
        const data: Record<string, any> = {};
        
        // Extract all entries from formData
        for (const [key, value] of formData.entries()) {
            // Skip next generic fields if any
            if (key.startsWith("$")) continue;
            data[key] = value;
        }

        // We'll iterate over the data and upsert each key
        // Note: For a real app, we might want to group these into categories
        // or validate them against a schema. For now, simplistic dynamic update.
        
        const updates = Object.entries(data).map(async ([key, value]) => {
            // Store everything as JSON string
            const valueStr = JSON.stringify(value);
            
            return prisma.systemSettings.upsert({
                where: { key },
                update: { value: valueStr },
                create: { key, value: valueStr },
            });
        });

        await Promise.all(updates);

        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error) {
        console.error("Failed to update system settings:", error);
        return { error: "Failed to update settings" };
    }
}
