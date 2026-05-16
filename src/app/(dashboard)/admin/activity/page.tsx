import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@/lib/types";
import { RecentActivityTable } from "@/components/admin/RecentActivityTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ShieldCheck } from "lucide-react";
import { DashboardTable } from "@/components/dashboard/DashboardTable";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminActivityPage() {
    const session = await auth();
    // @ts-ignore
    const role = session?.user?.role;
    if (!session?.user || (role !== Role.ADMIN && role !== Role.OPERATIONS_MANAGER)) {
        redirect("/parent");
    }

    const activities = await prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        include: { 
            user: { 
                select: { 
                    email: true, 
                    firstName: true, 
                    lastName: true, 
                } 
            } 
        }
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Activity Feed"
                subtitle="Monitor system-wide events and user actions."
            />

            <DashboardTable
                title="Historical Activity"
                description="Comprehensive list of all platform events."
                icon={<ShieldCheck size={18} />}
            >
                <RecentActivityTable activities={activities} />
            </DashboardTable>
        </div>
    );
}
