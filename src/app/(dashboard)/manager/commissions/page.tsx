import { getManagerStats, getManagerCommissions } from "@/app/actions/manager";
import { getMinimumPayoutAmount } from "@/app/actions/settings";
import { RequestPayoutDialog } from "@/components/dashboard/RequestPayoutDialog";
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
    const minimumPayoutAmount = await getMinimumPayoutAmount();

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Commissions & Payouts</h1>
                    <p className="text-muted-foreground">Track earnings and manage payouts.</p>
                </div>
                {stats && (
                  <RequestPayoutDialog 
                    availableBalance={stats.approvedBalance} 
                    minimumPayoutAmount={minimumPayoutAmount}
                  />
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                 <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Earnings</h3>
                    <div className="text-2xl font-bold mt-2">GHS {stats?.totalEarnings.toFixed(2)}</div>
                 </div>
                 <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Approved Balance</h3>
                    <div className="text-2xl font-bold mt-2 text-green-600">GHS {stats?.approvedBalance.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Ready for payout</p>
                 </div>
                 <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Pending Balance</h3>
                    <div className="text-2xl font-bold mt-2 text-amber-600">GHS {stats?.pendingBalance.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
                 </div>
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
                            commissions.map((comm: any) => (
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
