import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@/lib/types";
import Link from "next/link";
import { getTeamMembers } from "@/app/actions/team-leader";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DashboardTable } from "@/components/dashboard/DashboardTable";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function TeamLeaderTeamPage() {
    const session = await auth();
    // @ts-ignore
    const role = session?.user?.role;

    if (!session?.user || role !== Role.TEAM_LEADER) {
        redirect("/parent");
    }

    const teamMembers = await getTeamMembers();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader 
                title="My Team" 
                subtitle="Affiliates assigned to your team"
                actions={
                    <Button variant="outline" size="sm" disabled>
                        <UserPlus size={16} className="mr-2" /> Recruit New
                    </Button>
                }
            />

            <DashboardTable
                title="Team Members"
                description="Monitor performance of your assigned affiliates"
                icon={<Users size={18} />}
            >
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                        <TableRow>
                            <TableHead className="font-bold">Affiliate</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                            <TableHead className="text-right font-bold">Total Sales</TableHead>
                            <TableHead className="font-bold">Joined</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teamMembers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                                    No affiliates assigned to your team yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            (teamMembers as any[]).map((member: any) => (
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
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </DashboardTable>
        </div>
    );
}
