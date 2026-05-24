"use client";

import { useState, useEffect } from "react";
import { getManagerStats, getManagerCommissions } from "@/app/actions/manager";
import { getMinimumPayoutAmount, getSystemSettings } from "@/app/actions/settings";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/ui/table-pagination";
import { Loader2, DollarSign, Wallet, Clock, TrendingUp, Search, Calendar, CheckCircle2 } from "lucide-react";
import { getCurrencySymbol, cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PremiumKPICard } from "@/components/dashboard/PremiumKPICard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Commission {
    id: string;
    createdAt: string | Date;
    sourceType: string;
    amount: number | { toString: () => string };
    status: string;
    currency?: string;
}

interface Stats {
    totalEarnings: number;
    approvedBalance: number;
    pendingBalance: number;
    currency?: string;
}


export default function AdminCommissionsPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [minimumPayout, setMinimumPayout] = useState(0);
    const [currency, setCurrency] = useState("GHS");

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadCommissions(currentPage, itemsPerPage);
    }, [currentPage, itemsPerPage]);

    async function loadInitialData() {
        try {
            const [statsData, minPayout, settings] = await Promise.all([
                getManagerStats(),
                getMinimumPayoutAmount(),
                getSystemSettings()
            ]);
            setStats(statsData);
            setMinimumPayout(minPayout);
            setCurrency(statsData?.currency || settings.currency || "GHS");
        } catch (error) {
            console.error("Failed to load initial data:", error);
        }
    }

    async function loadCommissions(page: number, size: number) {
        setLoading(true);
        try {
            const data = await getManagerCommissions(page, size);
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

    if (loading && commissions.length === 0 && !stats) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-[#E87154]" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
             <PageHeader 
                title="Earnings Overview"
                subtitle="High-level oversight of override distributions and secure disbursement queue"

             />

            <div className="grid gap-4 md:grid-cols-3">
                <PremiumKPICard
                    title="Aggregated Earnings"
                    value={`${currencySymbol} ${(stats?.totalEarnings ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    icon={DollarSign}
                    theme="primary"
                    trend={{ value: "Network", label: "Cumulative", type: "up" }}
                />
                <PremiumKPICard
                    title="Liquidity (Approved)"
                    value={`${currencySymbol} ${(stats?.approvedBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    icon={Wallet}
                    theme="success"
                    description="Verified & Ready"
                />
                <PremiumKPICard
                    title="Pipeline (Pending)"
                    value={`${currencySymbol} ${(stats?.pendingBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    icon={Clock}
                    theme="warning"
                    description="Awaiting audit"
                />
            </div>

            <div className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="p-8 pb-4 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-black">Earnings Log</CardTitle>
                        <CardDescription>Comprehensive record of all network-driven rewards</CardDescription>
                    </div>

                    <div className="flex items-center gap-3 px-4 h-11 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-inner border-none w-full sm:w-auto">
                        <Search size={16} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ledger Search</span>
                    </div>
                </div>
                <div className="overflow-x-auto relative w-full">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="pl-10">Timestamp</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Credit Value</TableHead>
                                <TableHead className="text-right pr-10">Verification Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {commissions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-24 text-slate-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <DollarSign className="h-12 w-12 opacity-10" />
                                            <p className="font-bold tracking-wide">No transaction entries found in this log.</p>

                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                commissions.map((comm) => (
                                    <TableRow key={comm.id} className="group transition-all duration-300">
                                        <TableCell className="pl-10 py-6">
                                            <div className="flex items-center gap-3 text-slate-500 font-medium">
                                                <Calendar size={14} className="text-slate-300" />
                                                <span className="text-sm">{new Date(comm.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.2em] bg-slate-50 dark:bg-slate-800 border-none px-3 h-7">
                                                {comm.sourceType}
                                            </Badge>
                                        </TableCell>
                                         <TableCell>
                                            <span className="text-base font-black text-slate-900 dark:text-white whitespace-nowrap group-hover:text-[#E87154] transition-colors">
                                                <span className="text-[10px] text-slate-400 mr-1 font-bold uppercase">{getCurrencySymbol(comm.currency || currency)}</span>
                                                {Number(comm.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                         </TableCell>
                                        <TableCell className="text-right pr-10">
                                            <Badge 
                                                className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest border-none px-4 h-7 shadow-sm",
                                                    comm.status === 'PAID' ? 'bg-emerald-500 text-white' : 
                                                    comm.status === 'APPROVED' ? 'bg-blue-500 text-white' : 
                                                    'bg-amber-500 text-white'
                                                )}
                                            >
                                                {comm.status === 'PAID' && <CheckCircle2 size={10} className="mr-1.5" />}
                                                {comm.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="p-6 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                    <TablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={total}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(value) => {
                            setItemsPerPage(value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
