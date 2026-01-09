import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminFinancePage() {
  const payoutRequests = await prisma.payoutRequest.findMany({
      include: { user: true },
      orderBy: { requestedAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Finance & Payouts</h1>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {payoutRequests.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No pending payout requests.
                    </TableCell>
                </TableRow>
            )}
            {payoutRequests.map((req) => (
              <TableRow key={req.id}>
                <TableCell>{req.user.email}</TableCell>
                <TableCell>{req.user.role}</TableCell>
                <TableCell>GHS {req.amount.toString()}</TableCell>
                <TableCell>{req.status}</TableCell>
                <TableCell>{new Date(req.requestedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                    <Button size="sm" variant="outline">View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
