import { getManagerStats, getManagerCommissions } from "@/app/actions/manager";
import { RequestPayoutDialog } from "@/components/manager/RequestPayoutDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function ManagerCommissionsPage() {
    const stats = await getManagerStats();
    const commissions = await getManagerCommissions();

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Commissions & Payouts</h1>
                    <p className="text-muted-foreground">Track earnings and manage payouts.</p>
                </div>
                {stats && <RequestPayoutDialog availableBalance={stats.pendingPayout} />}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                 <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Earnings</h3>
                    <div className="text-2xl font-bold mt-2">GHS {stats?.totalEarnings.toFixed(2)}</div>
                 </div>
                 <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Available for Payout</h3>
                    <div className="text-2xl font-bold mt-2 text-green-600">GHS {stats?.pendingPayout.toFixed(2)}</div>
                 </div>
                 {/* Can add pending (unapproved) commissions here if we distinguish */}
            </div>

             <div className="rounded-md border">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {commissions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    No commissions yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            commissions.map((comm) => (
                                <TableRow key={comm.id}>
                                     <TableCell>{new Date(comm.createdAt).toLocaleDateString()}</TableCell>
                                     <TableCell className="capitalize">{comm.sourceType.toLowerCase()}</TableCell>
                                     <TableCell>GHS {comm.amount}</TableCell>
                                     <TableCell>
                                        <Badge variant={
                                            comm.status === 'PAID' ? 'default' : 
                                            comm.status === 'APPROVED' ? 'outline' : 'secondary'
                                        }>
                                            {comm.status}
                                        </Badge>
                                     </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
