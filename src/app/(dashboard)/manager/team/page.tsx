import { getTeamMembers } from "@/app/actions/manager";
import { InviteAffiliateDialog } from "@/components/manager/InviteAffiliateDialog";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function ManagerTeamPage() {
    const session = await auth();
    const user = await prisma.user.findUnique({ 
        where: { id: session?.user?.id },
        select: { inviteCode: true }
    });
    
    const team = await getTeamMembers();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Team</h1>
                    <p className="text-muted-foreground">Manage your affiliates and track their performance.</p>
                </div>
                {user?.inviteCode && <InviteAffiliateDialog inviteCode={user.inviteCode} />}
            </div>

            <div className="rounded-md border">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Customers Referred</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {team.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    No team members yet. Invite someone!
                                </TableCell>
                            </TableRow>
                        ) : (
                            team.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">
                                        {member.firstName} {member.lastName}
                                    </TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell>{member.referralsCount}</TableCell>
                                    <TableCell>
                                        <Badge variant={member.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                            {member.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
