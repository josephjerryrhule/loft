import { prisma } from "@/lib/prisma";

export enum ActionType {
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    REGISTER = "REGISTER",
    CREATE_ORDER = "CREATE_ORDER",
    UPDATE_USER = "UPDATE_USER",
    DELETE_USER = "DELETE_USER",
    SUBSCRIPTION = "SUBSCRIPTION",
    SUBSCRIPTION_COMMISSION = "SUBSCRIPTION_COMMISSION",
    // Add more as needed
}

export async function logActivity(
    userId: string | null, // null for system actions if needed, though schema has userId
    actionType: string,
    actionDetails?: string
) {
    try {
        await prisma.activityLog.create({
            data: {
                userId: userId,
                actionType: actionType,
                actionDetails: actionDetails,
            }
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
        // Don't throw, logging failure shouldn't break the app flow
    }
}
