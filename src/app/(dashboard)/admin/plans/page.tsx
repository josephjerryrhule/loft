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
import { Plus, Trash2, Loader2 } from "lucide-react";
import { EditPlanDialog } from "@/components/admin/EditPlanDialog";
import { getAllPlans, createPlan, deletePlan } from "@/app/actions/plans";
import { TablePagination } from "@/components/ui/table-pagination";
import { toast } from "sonner";
import { useRouter } from "next/navigation";


export default function AdminPlansPage() {
    const router = useRouter();
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [creatingPlan, setCreatingPlan] = useState(false);

    useEffect(() => {
        loadPlans();
    }, []);

    async function loadPlans() {
        setLoading(true);
        const data = await getAllPlans();
        setPlans(data);
        setLoading(false);
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this plan?")) return;
        
        await deletePlan(id);
        toast.success("Plan deleted successfully");
        loadPlans();
    }

    async function handleCreatePlan(formData: FormData) {
        setCreatingPlan(true);
        try {
            const result = await createPlan(formData);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Plan created successfully");
                setCreateDialogOpen(false);
                loadPlans();
            }
        } catch {
            toast.error("Failed to create plan");
        } finally {
            setCreatingPlan(false);
        }
    }

    // Pagination logic
    const totalPages = Math.ceil(plans.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPlans = plans.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (items: number) => {
        setItemsPerPage(items);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
                    <p className="text-muted-foreground">Manage subscription plans for customers.</p>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Plan</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Plan</DialogTitle>
                            <DialogDescription>Add a new subscription plan.</DialogDescription>
                        </DialogHeader>
                        <form action={handleCreatePlan} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Plan Name</Label>
                                <Input id="name" name="name" placeholder="Premium" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" placeholder="Access to all premium content" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price (GHS)</Label>
                                    <Input id="price" name="price" type="number" step="0.01" placeholder="49.99" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="durationDays">Duration (days)</Label>
                                    <Input id="durationDays" name="durationDays" type="number" placeholder="30" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="features">Features (one per line)</Label>
                                <Textarea id="features" name="features" placeholder="Unlimited flipbooks&#10;Priority support&#10;Early access" />
                            </div>
                            <Button type="submit" className="w-full" disabled={creatingPlan}>
                                {creatingPlan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Plan
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    <div className="rounded-md border bg-white dark:bg-slate-900">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedPlans.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            No plans yet. Create one to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedPlans.map((plan) => (
                                        <TableRow key={plan.id}>
                                            <TableCell className="font-medium">{plan.name}</TableCell>
                                            <TableCell>GHS {Number(plan.price).toFixed(2)}</TableCell>
                                            <TableCell>{plan.durationDays} days</TableCell>
                                            <TableCell>
                                                <Badge variant={plan.isActive ? "default" : "secondary"}>
                                                    {plan.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <EditPlanDialog plan={plan} onSuccess={loadPlans} />
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => {
                                                            const url = `${window.location.origin}/auth/register?planId=${plan.id}`;
                                                            navigator.clipboard.writeText(url);
                                                            toast.success("Checkout link copied to clipboard");
                                                        }}
                                                        title="Copy Checkout Link"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        onClick={() => handleDelete(plan.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    
                    {plans.length > 0 && (
                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            itemsPerPage={itemsPerPage}
                            totalItems={plans.length}
                            onPageChange={handlePageChange}
                            onItemsPerPageChange={handleItemsPerPageChange}
                        />
                    )}
                </>
            )}
        </div>
    );
}
