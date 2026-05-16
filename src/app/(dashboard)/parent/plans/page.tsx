import { getPlans, getUserSubscriptions } from "@/app/actions/plans";
import { getChildProfiles } from "@/app/actions/children";
import { auth } from "@/auth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Info, Users, CreditCard, Calendar, AlertCircle, Zap, ShieldCheck } from "lucide-react";
import { SubscribePlanButton } from "@/components/payment/SubscribePlanButton";
import { AssignSubscriptionDialog } from "@/components/payment/AssignSubscriptionDialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CustomerPlansPage() {
    const session = await auth();
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;

    if (!userId || !userEmail) return null;

    const [allPlans, activeSubscriptions, childProfiles] = await Promise.all([
        getPlans(),
        getUserSubscriptions(userId),
        getChildProfiles()
    ]);
    
    // Format plans
    const plans = allPlans.map(plan => ({
        ...plan,
        price: Number(plan.price),
    }));

    // Helper to find subscription for a child
    const getChildSubscription = (childProfileId: string | null) => {
        return activeSubscriptions.find(sub => sub.childProfileId === childProfileId);
    };

    const unassignedSubscriptions = activeSubscriptions.filter(sub => !sub.childProfileId && Number(sub.plan.price) > 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <PageHeader
                title="Plans & Access"
                subtitle="Manage your family's reading plans and account details."
            />

            {unassignedSubscriptions.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-100 rounded-[1.5rem] p-6 flex items-start gap-4 shadow-sm animate-in slide-in-from-top-4 duration-700">
                    <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
                        <Info size={20} />
                    </div>
                    <div className="space-y-1">
                        <h5 className="text-base font-black text-amber-900 leading-none">Action Required: Unassigned Plans</h5>
                        <p className="text-sm text-amber-700 font-medium">
                            You have <span className="font-black underline">{unassignedSubscriptions.length} active plan(s)</span> waiting to be linked to a member. Please assign them below.
                        </p>
                    </div>
                </div>
            )}


            <Tabs defaultValue="management" className="w-full">
                <TabsList className="bg-stone-100 p-1 rounded-xl mb-8 border-none w-fit h-auto flex flex-wrap shadow-inner gap-1">
                    <TabsTrigger value="management" className="rounded-lg px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-[#E87154] data-[state=active]:shadow-sm transition-all gap-2">
                        <Users size={16} /> Family Access
                    </TabsTrigger>
                    <TabsTrigger value="plans" className="rounded-lg px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-[#E87154] data-[state=active]:shadow-sm transition-all gap-2">
                        <Zap size={16} /> New Plans
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="management" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-none shadow-md overflow-hidden bg-white rounded-[2rem]">
                        <CardHeader className="p-8 sm:p-10 bg-stone-50 border-b border-stone-100">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="h-6 w-6 rounded-lg bg-[#E87154]/10 flex items-center justify-center">
                                    <Users size={12} className="text-[#E87154]" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Members</span>
                            </div>
                            <CardTitle className="text-2xl font-black">Family Members</CardTitle>
                            <CardDescription className="text-sm font-medium">Manage and upgrade the reading access for everyone in your household.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-none">
                                            <TableHead className="pl-10">Name</TableHead>
                                            <TableHead>Current Plan</TableHead>
                                            <TableHead>Access Status</TableHead>
                                            <TableHead>Renewal Date</TableHead>
                                            <TableHead className="text-right pr-10">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {childProfiles.map((child) => {
                                            const sub = getChildSubscription(child.id);
                                            return (
                                                <TableRow key={child.id} className="group transition-all duration-300">
                                                    <TableCell className="pl-10 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div 
                                                                className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm"
                                                                style={{ backgroundColor: child.avatarColor || "#E87154" }}
                                                            >
                                                                {child.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-slate-900 tracking-tight">{child.name}</span>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">Active Profile</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {sub ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-[#E87154] tracking-tight">{sub.plan.name}</span>
                                                                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter">Full Access</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-stone-400 font-bold italic text-sm">Free Basic</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {sub ? (
                                                            <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] font-black uppercase tracking-widest px-3 h-7 shadow-sm">
                                                                Verified
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-stone-300 border-stone-100 text-[10px] font-black uppercase tracking-widest px-3 h-7">Limited</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-slate-500 font-medium text-sm">
                                                        {sub ? (
                                                            <div className="flex items-center gap-2">
                                                                <Calendar size={14} className="text-stone-300" />
                                                                <span>{new Date(sub.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                            </div>
                                                        ) : <span className="text-stone-200">—</span>}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-10">
                                                        <SubscribePlanButton 
                                                            allPlans={plans}
                                                            userEmail={userEmail}
                                                            userId={userId}
                                                            userRole={(session?.user as any)?.role}
                                                            childProfiles={childProfiles}
                                                            initialChildId={child.id}
                                                            label={sub ? "Change Plan" : "Upgrade Plan"}
                                                            allowSelfProfile={false}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {unassignedSubscriptions.length > 0 && (
                        <Card className="border-none shadow-md overflow-hidden bg-stone-50 text-slate-900 rounded-[2rem] animate-in zoom-in-95 duration-500">
                            <CardHeader className="p-8 sm:p-10 border-b border-stone-100">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="h-6 w-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                        <AlertCircle size={12} className="text-amber-600" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Action Required</span>
                                </div>
                                <CardTitle className="text-2xl font-black">Link Your Plans</CardTitle>
                                <CardDescription className="text-stone-600 font-medium italic">These plans are active but need to be linked to a member profile.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-none">
                                            <TableHead className="pl-10 text-stone-500">Plan Type</TableHead>
                                            <TableHead className="text-stone-500 text-right">Price</TableHead>
                                            <TableHead className="text-stone-500">Renewal Date</TableHead>
                                            <TableHead className="text-right pr-10 text-stone-500">Assignment</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {unassignedSubscriptions.map((sub) => (
                                            <TableRow key={sub.id} className="border-stone-100 transition-colors hover:bg-white/50">
                                                <TableCell className="pl-10 py-6 font-black text-slate-900">{sub.plan.name}</TableCell>
                                                <TableCell className="text-right font-black text-[#E87154]">GHS {Number(sub.plan.price).toFixed(2)}</TableCell>
                                                <TableCell className="text-stone-600 font-medium">{new Date(sub.endDate).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right pr-10">
                                                    <AssignSubscriptionDialog 
                                                        subscriptionId={sub.id} 
                                                        childProfiles={childProfiles} 
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>


                <TabsContent value="plans" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-none shadow-md overflow-hidden bg-white rounded-[2rem]">
                        <CardHeader className="p-8 sm:p-10 bg-stone-50 border-b border-stone-100">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="h-6 w-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <CreditCard size={12} className="text-blue-500" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Library Access</span>
                            </div>
                            <CardTitle className="text-2xl font-black">Membership Plans</CardTitle>
                            <CardDescription className="text-sm font-medium">Unlock the full library of interactive stories for your children.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-none">
                                            <TableHead className="pl-10">Plan Name</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Benefits</TableHead>
                                            <TableHead className="text-right pr-10">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {/* Free Plan Row */}
                                        <TableRow className="bg-stone-50/50">
                                            <TableCell className="pl-10 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900">LOFT BASIC</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Standard Entry</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-black text-slate-300">GHS 0.00</TableCell>
                                            <TableCell className="font-bold text-stone-300">UNLIMITED</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge variant="outline" className="flex items-center gap-2 font-black uppercase text-[9px] tracking-tighter bg-white border-none shadow-sm px-3">
                                                        <Check className="h-3 w-3 text-emerald-500" />
                                                        Public Stories
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-10">
                                                <Badge className="bg-stone-100 text-stone-400 border-none text-[10px] font-black uppercase tracking-widest px-3 h-7">Default</Badge>
                                            </TableCell>
                                        </TableRow>

                                        {/* Paid Plans */}
                                        {plans.map((plan) => (
                                            <TableRow key={plan.id} className="group transition-all duration-300">
                                                <TableCell className="pl-10 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-900 tracking-tight group-hover:text-[#E87154] transition-colors">{plan.name}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 line-clamp-1 max-w-[250px]">{plan.description}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-base font-black text-[#E87154]">GHS {plan.price.toFixed(2)}</span>
                                                </TableCell>
                                                <TableCell className="font-black text-slate-700 text-sm uppercase tracking-tighter">{plan.durationDays} Days</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-2">
                                                        {plan.features?.split("\n").slice(0, 2).map((feature, i) => (
                                                            <Badge key={i} className="flex items-center gap-1.5 font-black uppercase text-[9px] tracking-tighter bg-emerald-50 text-emerald-700 border-none px-3 py-1">
                                                                <ShieldCheck className="h-3 w-3" />
                                                                {feature}
                                                            </Badge>
                                                        ))}
                                                        {(plan.features?.split("\n")?.length ?? 0) > 2 && (
                                                            <span className="text-[9px] font-black text-stone-300 flex items-center">
                                                                +{(plan.features?.split("\n")?.length ?? 0) - 2} MORE
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-10">
                                                    <SubscribePlanButton 
                                                        plan={plan}
                                                        userEmail={userEmail}
                                                        userId={userId}
                                                        userRole={(session?.user as any)?.role}
                                                        childProfiles={childProfiles}
                                                        allowSelfProfile={false}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-stone-300 py-6 animate-pulse">
                        <div className="flex items-center gap-3">
                            <Info className="h-4 w-4 text-[#E87154]" />
                            <span>Plans apply per family member</span>
                        </div>
                        <div className="hidden sm:block h-6 w-px bg-stone-100" />
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            <span>Secure checkout powered by Paystack</span>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
