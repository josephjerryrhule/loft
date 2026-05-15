"use client";

import { useState, useEffect } from "react";
import { getTeamMembers, getManagerTeamLeaders } from "@/app/actions/manager";
import { InviteAffiliateDialog } from "@/components/manager/InviteAffiliateDialog";
import { UserActions } from "@/components/admin/UserActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Loader2 } from "lucide-react";

interface TeamMember {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
    status: string;
    createdAt: string | Date;
    referralsCount: number;
    teamLeaderId: string | null;
    teamLeaderName: string | null;
}


export default function ManagerTeamPage() {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [teamLeaders, setTeamLeaders] = useState<{id: string, name: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

    useEffect(() => {
        loadTeam(currentPage);
    }, [currentPage]);

    async function loadTeam(page: number) {
        setLoading(true);
        try {
            const [teamData, leadersData] = await Promise.all([
                getTeamMembers(page, pageSize),
                getManagerTeamLeaders()
            ]);
            setTeam(teamData.members as TeamMember[]);
            setTeamLeaders(leadersData);
            setTotalPages(teamData.totalPages);
            setTotal(teamData.total);
        } catch (error) {
            console.error("Failed to load team:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading && team.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Team</h1>
                    <p className="text-muted-foreground">Manage your affiliates and track their performance.</p>
                </div>
                <InviteAffiliateDialog />
            </div>

            <div className="rounded-md border">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Team Leader</TableHead>
                            <TableHead>Customers Referred</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {team.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    No team members yet. Invite someone!
                                </TableCell>
                            </TableRow>
                        ) : (
                            team.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{member.firstName} {member.lastName}</span>
                                            <span className="text-xs text-muted-foreground">{member.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px] uppercase">
                                            {member.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">{member.teamLeaderName || "-"}</span>
                                    </TableCell>
                                    <TableCell className="text-center">{member.referralsCount}</TableCell>
                                    <TableCell>
                                        <Badge variant={member.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                            {member.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <UserActions 
                                            user={member} 
                                            teamLeaders={teamLeaders.filter(l => l.id !== member.id)} 
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={pageSize}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}
