"use client";

import { useState, useEffect } from "react";
import { getManagerStats, getManagerCommissions } from "@/app/actions/manager";
import { getSystemSettings } from "@/app/actions/settings";
import { getAmbassadorPayouts } from "@/app/actions/payout";
import { SignPayoutDialog } from "@/components/dashboard/SignPayoutDialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, DollarSign, Wallet, Clock, Search, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { getCurrencySymbol, cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PremiumKPICard } from "@/components/dashboard/PremiumKPICard";
import { CardTitle, CardDescription } from "@/components/ui/card";

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

export default function ManagerCommissionsPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [userName, setUserName] = useState("");
    const [loading, setLoading] = useState(true);
    const [ledgerPage, setLedgerPage] = useState(1);
    const [ledgerTotalPages, setLedgerTotalPages] = useState(1);
    const [ledgerTotal, setLedgerTotal] = useState(0);
    const [ledgerItemsPerPage, setLedgerItemsPerPage] = useState(10);
    const [payoutsPage, setPayoutsPage] = useState(1);
    const [payoutsTotalPages, setPayoutsTotalPages] = useState(1);
    const [payoutsTotal, setPayoutsTotal] = useState(0);
    const [currency, setCurrency] = useState("GHS");

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadCommissions(ledgerPage, ledgerItemsPerPage);
    }, [ledgerPage, ledgerItemsPerPage]);

    useEffect(() => {
        loadPayouts(payoutsPage);
    }, [payoutsPage]);

    async function loadInitialData() {
        setLoading(true);
        try {
            const [statsData, settings] = await Promise.all([
                getManagerStats(),
                getSystemSettings()
            ]);
            setStats(statsData);
            setCurrency(statsData?.currency || settings.currency || "GHS");
            await Promise.all([
                loadCommissions(1, ledgerItemsPerPage),
                loadPayouts(1)
            ]);
        } catch (error) {
            console.error("Failed to load initial data:", error);
        } finally {
            setLoading(false);
        }
    }

    async function loadCommissions(page: number, size: number) {
        try {
            const data = await getManagerCommissions(page, size);
            setCommissions(data.commissions as Commission[]);
            setLedgerTotalPages(data.totalPages);
            setLedgerTotal(data.total);
        } catch (error) {
            console.error("Failed to load commissions:", error);
        }
    }

    async function loadPayouts(page: number) {
        try {
            const data = await getAmbassadorPayouts(page, 10);
            if (data.payouts) {
                setPayouts(data.payouts);
                setUserName(data.userName || "Ambassador");
                setPayoutsTotalPages(data.totalPages || 1);
                setPayoutsTotal(data.total || 0);
            }
        } catch (error) {
            console.error("Failed to load payouts:", error);
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
                subtitle="High-level oversight of override distributions and manage weekly payouts"
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

            <Tabs defaultValue="ledger" className="w-full">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6 border-none w-fit h-auto flex gap-1 shadow-inner">
                    <TabsTrigger value="ledger" className="rounded-lg px-6 py-2.5 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#E87154] data-[state=active]:shadow-sm transition-all text-sm">
                        Earnings Log
                    </TabsTrigger>
                    <TabsTrigger value="payouts" className="rounded-lg px-6 py-2.5 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#E87154] data-[state=active]:shadow-sm transition-all text-sm">
                        Weekly Payout Statements
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="ledger" className="animate-in fade-in duration-300">
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
                                currentPage={ledgerPage}
                                totalPages={ledgerTotalPages}
                                itemsPerPage={ledgerItemsPerPage}
                                totalItems={ledgerTotal}
                                onPageChange={setLedgerPage}
                                onItemsPerPageChange={(value) => {
                                    setLedgerItemsPerPage(value);
                                    setLedgerPage(1);
                                }}
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="payouts" className="animate-in fade-in duration-300">
                    <div className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white dark:bg-slate-900">
                        <div className="p-8 pb-4 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-black">Payout Statements</CardTitle>
                                <CardDescription>Manage and digitally sign your automatic weekly commission payouts</CardDescription>
                            </div>
                        </div>
                        <div className="overflow-x-auto relative w-full">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="pl-10">Week Period</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Authorization</TableHead>
                                        <TableHead className="text-right pr-10">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payouts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-24 text-slate-400">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Clock className="h-12 w-12 opacity-10" />
                                                    <p className="font-bold tracking-wide">No weekly payout statements generated yet.</p>
                                                    <p className="text-xs text-slate-400">Earnings mature at the end of each week (Monday to Sunday) and become payable the following week.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        payouts.map((p) => {
                                            const startStr = new Date(p.weekStart).toLocaleDateString(undefined, { month: "short", day: "numeric" });
                                            const endStr = new Date(p.weekEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
                                            
                                            return (
                                                <TableRow key={p.id} className="group transition-all duration-300">
                                                    <TableCell className="pl-10 py-6">
                                                        <div className="flex items-center gap-3 text-slate-900 dark:text-white font-bold">
                                                            <Calendar size={14} className="text-slate-400" />
                                                            <span className="text-sm">Week: {startStr} - {endStr}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            {p.amountGHS > 0 && (
                                                                <span className="text-sm font-black text-slate-900 dark:text-white">₵{p.amountGHS.toFixed(2)}</span>
                                                            )}
                                                            {p.amountUSD > 0 && (
                                                                <span className="text-sm font-black text-slate-900 dark:text-white">${p.amountUSD.toFixed(2)}</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge 
                                                            className={cn(
                                                                "text-[10px] font-black uppercase tracking-widest border-none px-3.5 h-6 shadow-sm",
                                                                p.status === 'PAID' ? 'bg-emerald-500 text-white' : 
                                                                p.status === 'SIGNED' ? 'bg-purple-500 text-white' : 
                                                                p.status === 'APPROVED' ? 'bg-blue-500 text-white animate-pulse' : 
                                                                'bg-amber-500 text-white'
                                                            )}
                                                        >
                                                            {p.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {p.status === "SIGNED" || p.status === "PAID" ? (
                                                            <div className="text-xs text-slate-500">
                                                                <span className="font-bold text-slate-900 dark:text-white">Signed:</span> {p.signatureName}
                                                                <span className="block text-[10px] text-slate-400">{new Date(p.signedAt).toLocaleString()}</span>
                                                            </div>
                                                        ) : p.status === "APPROVED" ? (
                                                            <span className="text-xs text-blue-500 font-bold flex items-center gap-1">
                                                                <AlertCircle size={12} /> Awaiting Signature
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic">Processing Review</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-10">
                                                        {p.status === "APPROVED" && (
                                                            <SignPayoutDialog 
                                                              payout={p} 
                                                              userName={userName} 
                                                              onSuccess={() => loadPayouts(payoutsPage)} 
                                                            />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="p-6 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                            <TablePagination
                                currentPage={payoutsPage}
                                totalPages={payoutsTotalPages}
                                itemsPerPage={10}
                                totalItems={payoutsTotal}
                                onPageChange={setPayoutsPage}
                                onItemsPerPageChange={() => {}}
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
