import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@/lib/types";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DashboardTable } from "@/components/dashboard/DashboardTable";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { TeamMemberRoleAction } from "@/components/manager/TeamMemberRoleAction";
import { formatRole } from "@/lib/format-utils";

async function getManagerTeamMembers(managerId: string) {
    const members = await prisma.user.findMany({
        where: { managerId: managerId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            profilePictureUrl: true,
            _count: {
                select: {
                    referrals: true,
                    referredOrders: true
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    return members.map((m: any) => ({
        ...m,
        name: `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email,
        salesCount: m._count.referrals + m._count.referredOrders
    }));
}

export default async function ManagerTeamPage() {
    const session = await auth();
    // @ts-ignore
    const role = session?.user?.role;

    if (!session?.user || role !== Role.MANAGER) {
        redirect("/parent");
    }

    const teamMembers = await getManagerTeamMembers(session.user.id);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader 
                title="My Team" 
                subtitle="Affiliates and Team Leaders managed by you"
                actions={
                    <Button variant="outline" size="sm" disabled>
                        <UserPlus size={16} className="mr-2" /> Invite Affiliate
                    </Button>
                }
            />

            <DashboardTable
                title="Team Members"
                description="Performance of everyone in your hierarchy"
                icon={<Users size={18} />}
            >
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                        <TableRow>
                            <TableHead className="font-bold">Member</TableHead>
                            <TableHead className="font-bold">Role</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                            <TableHead className="text-right font-bold">Sales</TableHead>
                            <TableHead className="font-bold">Joined</TableHead>
                            <TableHead className="text-right font-bold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teamMembers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                                    No members in your team yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            teamMembers.map((member: any) => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border-2 border-white dark:border-slate-800 shadow-sm">
                                                <AvatarImage src={member.profilePictureUrl || ""} alt={member.name} />
                                                <AvatarFallback className="text-[10px] font-bold">{member.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{member.name}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">{member.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={member.role === Role.TEAM_LEADER ? "bg-blue-500/10 text-blue-600 border-none" : "bg-slate-500/10 text-slate-600 border-none"}>
                                            {formatRole(member.role)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={member.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600 border-none" : "bg-destructive/10 text-destructive border-none"}>
                                            {member.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-black">
                                        {member.salesCount}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500 font-medium">
                                        {new Date(member.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <TeamMemberRoleAction
                                            userId={member.id}
                                            currentRole={member.role}
                                            name={member.name}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </DashboardTable>
        </div>
    );
}
