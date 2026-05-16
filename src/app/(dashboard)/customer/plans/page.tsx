import { getPlans, getUserSubscription } from "@/app/actions/plans";
import { auth } from "@/auth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Clock, CreditCard, Star } from "lucide-react";
import { SubscribePlanButton } from "@/components/payment/SubscribePlanButton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CustomerPlansPage() {
    const session = await auth();
    const allPlans = await getPlans();
    
    const plans = allPlans.map(plan => ({
        ...plan,
        price: Number(plan.price),
    }));

    const currentSubscription = session?.user?.id 
        ? await getUserSubscription(session.user.id) 
        : null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader 
                title="Membership Tiers"
                subtitle="Choose the perfect path for your digital story adventure."
            />

            {currentSubscription && (
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-800/50 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Star size={32} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400 mb-1">Active Membership</p>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-none">{currentSubscription.plan.name}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-800/50">
                        <Clock size={18} className="text-emerald-500" />
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                            Renewing on {new Date(currentSubscription.endDate).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            )}

            <Card className="border-none shadow-md rounded-[2.5rem] overflow-hidden bg-white">
                <div className="bg-[#FFFAF5] p-10 border-b border-stone-100 relative">
                    <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12">
                        <Sparkles size={160} className="text-stone-900" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-6 w-6 rounded-lg bg-[#E87154]/10 flex items-center justify-center">
                                <CreditCard size={12} className="text-[#E87154]" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Subscription Plans</span>
                        </div>
                        <h2 className="text-4xl font-black leading-none tracking-tight text-slate-900">Available Plans</h2>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                <TableHead className="pl-10 h-16 text-[10px] font-black uppercase tracking-widest text-slate-400">Plan Name</TableHead>
                                <TableHead className="h-16 text-[10px] font-black uppercase tracking-widest text-slate-400">Investment</TableHead>
                                <TableHead className="h-16 text-[10px] font-black uppercase tracking-widest text-slate-400">Duration</TableHead>
                                <TableHead className="h-16 text-[10px] font-black uppercase tracking-widest text-slate-400">Features</TableHead>
                                <TableHead className="pr-10 h-16 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plans.map((plan) => {
                                const isCurrent = currentSubscription?.planId === plan.id;
                                const isFree = plan.price === 0;

                                return (
                                    <TableRow key={plan.id} className={cn(
                                        "group transition-all border-slate-50 dark:border-slate-800/50",
                                        isCurrent ? "bg-emerald-50/30 dark:bg-emerald-900/5" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                                    )}>
                                        <TableCell className="pl-10 py-8">
                                            <div className="flex flex-col">
                                                <span className="text-lg font-black text-slate-900 dark:text-white">{plan.name}</span>
                                                <span className="text-xs font-medium text-slate-500 mt-1 max-w-[200px]">{plan.description}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-8">
                                            <div className="flex flex-col">
                                                <span className={cn(
                                                    "text-2xl font-black leading-none",
                                                    isFree ? "text-slate-400" : "text-[#E87154]"
                                                )}>
                                                    GHS {plan.price.toFixed(2)}
                                                </span>
                                                {!isFree && <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">One-time payment</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-8 font-black text-slate-600 dark:text-slate-300">
                                            {plan.durationDays} Days
                                        </TableCell>
                                        <TableCell className="py-8">
                                            <div className="flex flex-wrap gap-2 max-w-sm">
                                                {plan.features?.split("\n").map((feature, i) => (
                                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                        <Check size={12} className="text-emerald-500" />
                                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-10 py-8 text-right">
                                            {isCurrent ? (
                                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest">
                                                    <Check size={14} /> Current
                                                </div>
                                            ) : (
                                                (session?.user?.email && session?.user?.id && (
                                                    <SubscribePlanButton 
                                                        plan={plan as any}
                                                        userEmail={session.user.email}
                                                        userId={session.user.id}
                                                        userRole={(session.user as any).role}
                                                        allowSelfProfile={true}
                                                    />
                                                ))
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}

import { cn } from "@/lib/utils";
