"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function getAmbassadorHierarchy() {
    const session = await auth();
    const role = (session?.user as any)?.role;
    
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        throw new Error("Unauthorized");
    }

    // Get all users who are part of the ambassador system
    const ambassadors = await prisma.user.findMany({
        where: {
            role: {
                in: ["OPERATIONS_MANAGER", "MANAGER", "TEAM_LEADER", "AFFILIATE"]
            }
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            status: true,
            ambassadorId: true,
            managerId: true,
            teamLeaderId: true,
            createdAt: true,
            profilePictureUrl: true,
            _count: {
                select: {
                    referrals: true,
                    referredOrders: true
                }
            }
        },
        orderBy: {
            role: "asc" // This will roughly group them by hierarchy (Admin/Ops at top)
        }
    });

    return ambassadors.map(a => ({
        ...a,
        name: `${a.firstName || ""} ${a.lastName || ""}`.trim() || a.email,
        salesCount: a._count.referrals + a._count.referredOrders
    }));
}

export async function getHierarchyData() {
    const session = await auth();
    const role = (session?.user as any)?.role;
    
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        throw new Error("Unauthorized");
    }

    const [operationsManagers, managers, teamLeaders] = await Promise.all([
        prisma.user.findMany({
            where: { role: "OPERATIONS_MANAGER" },
            select: { id: true, firstName: true, lastName: true, email: true }
        }),
        prisma.user.findMany({
            where: { role: "MANAGER" },
            select: { id: true, firstName: true, lastName: true, email: true }
        }),
        prisma.user.findMany({
            where: { role: "TEAM_LEADER" },
            select: { id: true, firstName: true, lastName: true, email: true }
        })
    ]);

    const format = (users: any[]) => users.map(u => ({
        id: u.id,
        name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email
    }));

    return {
        operationsManagers: format(operationsManagers),
        managers: format(managers),
        teamLeaders: format(teamLeaders)
    };
}
