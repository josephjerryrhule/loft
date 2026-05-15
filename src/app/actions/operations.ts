"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function getHierarchyData() {
    const session = await auth();
    const role = (session?.user as any)?.role;
    
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        throw new Error("Unauthorized");
    }

    const [opsManagers, managers, teamLeaders] = await Promise.all([
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

    const format = (u: any) => ({
        id: u.id,
        name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email
    });

    return {
        operationsManagers: opsManagers.map(format),
        managers: managers.map(format),
        teamLeaders: teamLeaders.map(format)
    };
}

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

export async function getOperationsDashboardStats() {
    const session = await auth();
    const role = (session?.user as any)?.role;
    
    if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
        throw new Error("Unauthorized");
    }

    const [
        totalAmbassadors,
        totalManagers,
        totalTeamLeaders,
        totalAffiliates,
        commissions,
        referrals
    ] = await Promise.all([
        prisma.user.count({ where: { role: { in: ["OPERATIONS_MANAGER", "MANAGER", "TEAM_LEADER", "AFFILIATE"] } } }),
        prisma.user.count({ where: { role: "MANAGER" } }),
        prisma.user.count({ where: { role: "TEAM_LEADER" } }),
        prisma.user.count({ where: { role: "AFFILIATE" } }),
        prisma.commission.aggregate({
            _sum: { amount: true },
        }),
        prisma.user.findMany({
            where: { referredById: { not: null } },
            include: {
                subscriptions: {
                    where: { paymentStatus: "COMPLETED" },
                    include: { plan: true }
                }
            }
        })
    ]);

    const totalAmbassadorRevenue = referrals.reduce((sum, ref) => {
        return sum + ref.subscriptions.reduce((subSum, sub) => subSum + Number(sub.plan.price), 0);
    }, 0);

    const totalCommissions = Number(commissions._sum.amount) || 0;

    return {
        totalAmbassadors,
        totalManagers,
        totalTeamLeaders,
        totalAffiliates,
        totalAmbassadorRevenue,
        totalCommissions,
        referralCount: referrals.length
    };
}
