"use client";

import { useState, useEffect } from "react";
import { getManagerStats, getManagerCommissions } from "@/app/actions/manager";
import { getMinimumPayoutAmount, getSystemSettings } from "@/app/actions/settings";
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
import { Pagination } from "@/components/ui/pagination";
import { Loader2 } from "lucide-react";
import { getCurrencySymbol } from "@/lib/utils";

interface Commission {
    id: string;
    createdAt: string | Date;
    sourceType: string;
    amount: number | { toString: () => string };
    status: string;
}

interface Stats {
    totalEarnings: number;
    approvedBalance: number;
    pendingBalance: number;
}

export default function ManagerCommissionsPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [minimumPayout, setMinimumPayout] = useState(0);
    const [currency, setCurrency] = useState("GHS");
    const pageSize = 10;

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadCommissions(currentPage);
    }, [currentPage]);

    async function loadInitialData() {
        try {
            const [statsData, minPayout, settings] = await Promise.all([
                getManagerStats(),
                getMinimumPayoutAmount(),
                getSystemSettings()
            ]);
            setStats(statsData);
            setMinimumPayout(minPayout);
            setCurrency(settings.currency || "GHS");
        } catch (error) {
            console.error("Failed to load initial data:", error);
        }
    }

    async function loadCommissions(page: number) {
        setLoading(true);
        try {
            const data = await getManagerCommissions(page, pageSize);
            setCommissions(data.commissions as Commission[]);
            setTotalPages(data.totalPages);
            setTotal(data.total);
        } catch (error) {
            console.error("Failed to load commissions:", error);
        } finally {
            setLoading(false);
        }
    }

    const currencySymbol = getCurrencySymbol(currency);

    if (loading && commissions.length === 0) {
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
                    <h1 className="text-3xl font-bold tracking-tight">Commissions & Payouts</h1>
                    <p className="text-muted-foreground">Track earnings and manage payouts.</p>
                </div>
                {stats && (
                  <RequestPayoutDialog 
                    availableBalance={stats.approvedBalance} 
                    minimumPayoutAmount={minimumPayout}
                  />
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                 <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Earnings</h3>
                    <div className="text-2xl font-bold mt-2">{currencySymbol} {stats?.totalEarnings.toFixed(2)}</div>
                 </div>
                 <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Approved Balance</h3>
                    <div className="text-2xl font-bold mt-2 text-green-600">{currencySymbol} {stats?.approvedBalance.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Ready for payout</p>
                 </div>
                 <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Pending Balance</h3>
                    <div className="text-2xl font-bold mt-2 text-amber-600">{currencySymbol} {stats?.pendingBalance.toFixed(2)}</div>
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
                            commissions.map((comm) => (
                                <TableRow key={comm.id}>
                                     <TableCell>{new Date(comm.createdAt).toLocaleDateString()}</TableCell>
                                     <TableCell className="capitalize">{comm.sourceType.toLowerCase()}</TableCell>
                                     <TableCell>{currencySymbol} {Number(comm.amount).toFixed(2)}</TableCell>
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
