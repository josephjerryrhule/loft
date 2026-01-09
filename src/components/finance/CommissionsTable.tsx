import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth } from "@/auth";

export default async function CommissionsTable() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const commissions = await prisma.commission.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="border rounded-md">
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
            {commissions.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No earnings yet.
                    </TableCell>
                </TableRow>
            )}
            {commissions.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{c.sourceType}</TableCell>
                <TableCell>GHS {c.amount.toString()}</TableCell>
                <TableCell>{c.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </div>
  );
}
