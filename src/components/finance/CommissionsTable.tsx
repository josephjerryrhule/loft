import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function CommissionsTable() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const commissions = await prisma.commission.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="border-none shadow-md rounded-xl overflow-hidden bg-white dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="pl-6">Date</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right pr-6">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                        No earnings yet.
                    </TableCell>
                </TableRow>
            )}
            {commissions.map((c) => (
              <TableRow key={c.id} className="group transition-colors">
                <TableCell className="pl-6 text-sm text-slate-500 font-medium">
                    {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </TableCell>
                <TableCell>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-800 border-none">
                        {c.sourceType}
                    </Badge>
                </TableCell>
                <TableCell className="font-black text-emerald-600">
                    <span className="text-[10px] opacity-70 mr-1">GHS</span>
                    {Number(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right pr-6">
                    <Badge 
                        variant={c.status === "PAID" ? "default" : c.status === "APPROVED" ? "secondary" : "outline"}
                        className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            c.status === "PAID" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none",
                            c.status === "APPROVED" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none",
                            c.status === "PENDING" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none"
                        )}
                    >
                        {c.status}
                    </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </div>
  );
}
