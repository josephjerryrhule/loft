"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, Crown, Clock, Zap, Percent, ShieldCheck, Search, Filter, Link as LinkIcon } from "lucide-react";
import { EditPlanDialog } from "@/components/admin/EditPlanDialog";
import { getAllPlans, createPlan, deletePlan } from "@/app/actions/plans";
import { TablePagination } from "@/components/ui/table-pagination";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function AdminPlansPage() {
    const router = useRouter();
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [creatingPlan, setCreatingPlan] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        loadPlans();
    }, []);

    async function loadPlans() {
        setLoading(true);
        try {
            const data = await getAllPlans();
            setPlans(data);
        } catch (error) {
            console.error("Failed to load plans:", error);
            toast.error("Failed to load plans");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this plan? This may affect existing subscriptions.")) return;
        
        try {
            await deletePlan(id);
            toast.success("Plan deleted successfully");
            loadPlans();
        } catch (error) {
            toast.error("Failed to delete plan");
        }
    }

    async function handleCreatePlan(formData: FormData) {
        setCreatingPlan(true);
        try {
            const result = await createPlan(formData);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("New subscription plan activated!");
                setCreateDialogOpen(false);
                loadPlans();
            }
        } catch {
            toast.error("Failed to create plan");
        } finally {
            setCreatingPlan(false);
        }
    }

    const filteredPlans = plans.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPlans = filteredPlans.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (items: number) => {
        setItemsPerPage(items);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <PageHeader
                title="Subscription Plans"
                subtitle="Design and manage tiers for your digital learning ecosystem"
                actions={
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#E87154] hover:bg-[#D66144] shadow-lg shadow-[#E87154]/20 gap-3 h-12 px-8 rounded-2xl font-black text-white transition-all active:scale-95">
                                <Plus size={20} /> Create Plan
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[50rem] w-[95vw] border-none shadow-2xl p-0 rounded-[2.5rem] overflow-y-auto max-h-[95vh]">
                            <div className="bg-[#FFFAF5] p-10 border-b border-stone-100 relative">
                                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12">
                                    <Crown size={140} className="text-stone-900" />
                                </div>
                                <DialogHeader className="relative z-10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-6 w-6 rounded-lg bg-[#E87154]/10 flex items-center justify-center">
                                            <Zap size={12} className="text-[#E87154]" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Plan Details</span>
                                    </div>
                                    <DialogTitle className="text-3xl font-black text-slate-900 leading-none tracking-tight">Create New Plan</DialogTitle>
                                    <DialogDescription className="text-slate-500 font-medium mt-4 text-base italic">
                                        Define access duration, pricing, and affiliate rewards for this plan.
                                    </DialogDescription>
                                </DialogHeader>
                            </div>

                            <form action={handleCreatePlan} className="p-10 space-y-8 bg-white overflow-x-hidden">
                                <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
                                    <div className="space-y-3">
                                        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Internal Name</Label>
                                        <Input id="name" name="name" placeholder="e.g. Early Explorer" required className="h-12 bg-slate-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="durationDays" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Access Period (Days)</Label>
                                        <div className="relative">
                                            <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <Input id="durationDays" name="durationDays" type="number" placeholder="30" required className="pl-12 h-12 bg-slate-50 border-none rounded-xl font-black focus-visible:ring-[#E87154] shadow-inner" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Public Description</Label>
                                    <Textarea id="description" name="description" placeholder="A short, catchy description seen by parents during checkout..." className="min-h-[100px] bg-slate-50 border-none rounded-2xl font-medium focus-visible:ring-[#E87154] shadow-inner p-4" />
                                </div>

                                <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
                                    <div className="space-y-3">
                                        <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Enrollment Fee (GHS)</Label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300 text-lg tracking-tighter">GHS</span>
                                            <Input id="price" name="price" type="number" step="0.01" placeholder="49.99" required className="pl-16 h-14 bg-slate-50 border-none rounded-2xl font-black text-xl focus-visible:ring-[#E87154] shadow-inner" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="affiliateCommissionPercentage" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Custom Affiliate Reward (%)</Label>
                                        <div className="relative">
                                            <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <Input 
                                                id="affiliateCommissionPercentage" 
                                                name="affiliateCommissionPercentage" 
                                                type="number" 
                                                step="0.01" 
                                                min="0" 
                                                max="100" 
                                                placeholder="Global Default" 
                                                className="pl-12 h-14 bg-slate-50 border-none rounded-2xl font-black text-xl text-emerald-600 focus-visible:ring-[#E87154] shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="features" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Core Features (One per line)</Label>
                                    <Textarea id="features" name="features" placeholder="Unlimited monthly gazettes&#10;Access to little lofters library&#10;Interactive storytelling" className="min-h-[140px] bg-slate-50 border-none rounded-2xl font-medium focus-visible:ring-[#E87154] shadow-inner p-5 leading-relaxed" />
                                </div>

                                <DialogFooter className="pt-4">
                                    <Button type="submit" className="w-full h-14 rounded-2xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-xl shadow-[#E87154]/20 transition-all active:scale-95 text-white text-base" disabled={creatingPlan}>
                                        {creatingPlan ? (
                                            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="mr-3 h-6 w-6" />
                                        )}
                                        Initialize New Plan
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                }
            />

            <Card className="border-none shadow-sm bg-white rounded-2xl sm:rounded-[1.5rem] overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col lg:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search tiers by name..." 
                                className="pl-11 h-12 bg-slate-50 border-none rounded-xl font-medium focus-visible:ring-[#E87154] shadow-inner w-full" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <Button variant="ghost" className="bg-slate-50 h-12 px-5 rounded-xl text-slate-500 font-bold border-none shadow-inner gap-2 hover:bg-slate-100 transition-all">
                                <Filter size={16} /> Filters
                            </Button>
                            <div className="h-8 w-[1px] bg-slate-200 hidden lg:block" />
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl shadow-inner border-none h-12">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Visibility:</span>
                                <Badge variant="outline" className="bg-white border-none shadow-sm text-[9px] font-black tracking-widest h-7 px-3">ACTIVE ONLY</Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-[#E87154]" />
                    <p className="text-sm font-bold text-stone-400 uppercase tracking-widest">Loading membership tiers...</p>
                </div>
            ) : (
                <div className="rounded-2xl sm:rounded-[2rem] border-none shadow-xl overflow-hidden bg-white">
                    <div className="overflow-x-auto relative w-full">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="pl-8">Membership Plans</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Affiliate Commission</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right pr-8">Management</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedPlans.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-24 text-slate-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <Zap className="h-12 w-12 opacity-10" />
                                                <p className="font-bold tracking-wide text-sm">No subscription tiers matched your filter.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedPlans.map((plan) => (
                                        <TableRow key={plan.id} className="group transition-all duration-300">
                                            <TableCell className="pl-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 tracking-tighter text-lg group-hover:text-[#E87154] transition-colors whitespace-nowrap">{plan.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5 line-clamp-1 max-w-[200px]">{plan.description || "No description provided"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full w-fit border border-slate-100">
                                                    <Clock size={12} className="text-slate-400" />
                                                    <span className="text-xs font-black text-slate-700 whitespace-nowrap">{plan.durationDays} DAYS</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-slate-900 leading-none whitespace-nowrap">
                                                        <span className="text-[10px] text-slate-400 mr-1 font-bold tracking-normal italic uppercase">GHS</span>
                                                        {Number(plan.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Verified Pricing</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {plan.affiliateCommissionPercentage ? (
                                                    <div className="flex items-center gap-2 text-emerald-600 font-black">
                                                        <Percent size={14} />
                                                        <span className="text-base">{Number(plan.affiliateCommissionPercentage).toFixed(1)}%</span>
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline" className="bg-slate-50 border-none text-[9px] font-black tracking-widest h-6 px-3 text-slate-400">GLOBAL DEFAULT</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    className={cn(
                                                        "text-[10px] font-black uppercase tracking-[0.2em] border-none shadow-sm h-7 px-4 rounded-full",
                                                        plan.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                                                    )}
                                                >
                                                    {plan.isActive ? "Live" : "Draft"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <div className="flex items-center justify-end gap-3">
                                                    <EditPlanDialog plan={plan} onSuccess={loadPlans} />
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        className="h-10 w-10 rounded-full hover:bg-indigo-50:bg-indigo-900/20 hover:text-indigo-600 transition-all group/btn"
                                                        onClick={() => {
                                                            const url = `${window.location.origin}/auth/register?planId=${plan.id}`;
                                                            navigator.clipboard.writeText(url);
                                                            toast.success("Checkout link copied to clipboard");
                                                        }}
                                                        title="Copy Direct Checkout Link"
                                                    >
                                                        <LinkIcon className="h-5 w-5" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-10 w-10 rounded-full hover:bg-red-50:bg-red-900/20 hover:text-red-600 transition-all group/btn"
                                                        onClick={() => handleDelete(plan.id)}
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    
                    {filteredPlans.length > 0 && (
                        <div className="p-6 border-t border-slate-50 bg-slate-50/30">
                            <TablePagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                itemsPerPage={itemsPerPage}
                                totalItems={filteredPlans.length}
                                onPageChange={handlePageChange}
                                onItemsPerPageChange={handleItemsPerPageChange}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
