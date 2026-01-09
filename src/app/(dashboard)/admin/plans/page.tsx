import { getAllPlans, createPlan, deletePlan } from "@/app/actions/plans";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
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
import { Plus, Trash2 } from "lucide-react";
import { revalidatePath } from "next/cache";
import { EditPlanDialog } from "@/components/admin/EditPlanDialog";

export default async function AdminPlansPage() {
    const plans = await getAllPlans();

    async function handleDelete(formData: FormData) {
        "use server";
        const id = formData.get("id") as string;
        await deletePlan(id);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
                    <p className="text-muted-foreground">Manage subscription plans for customers.</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Plan</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Plan</DialogTitle>
                            <DialogDescription>Add a new subscription plan.</DialogDescription>
                        </DialogHeader>
                        <form action={createPlan} className="space-y-4">
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
                            <Button type="submit" className="w-full">Create Plan</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plans.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    No plans yet. Create one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            plans.map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell className="font-medium">{plan.name}</TableCell>
                                    <TableCell>GHS {Number(plan.price).toFixed(2)}</TableCell>
                                    <TableCell>{plan.durationDays} days</TableCell>
                                    <TableCell>
                                        <Badge variant={plan.isActive ? "default" : "secondary"}>
                                            {plan.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <EditPlanDialog plan={plan} />
                                            <form action={handleDelete}>
                                                <input type="hidden" name="id" value={plan.id} />
                                                <Button variant="ghost" size="sm" type="submit">
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </form>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
