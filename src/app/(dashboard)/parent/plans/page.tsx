import { getPlans, getUserSubscriptions } from "@/app/actions/plans";
import { getChildProfiles } from "@/app/actions/children";
import { auth } from "@/auth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Info, Users, CreditCard, Calendar } from "lucide-react";
import { SubscribePlanButton } from "@/components/payment/SubscribePlanButton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

    return (
        <div className="space-y-8 max-w-6xl mx-auto py-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Subscription Management
                </h1>
                <p className="text-muted-foreground text-lg">
                    Manage access and plans for your children.
                </p>
            </div>

            <Tabs defaultValue="management" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
                    <TabsTrigger value="management" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Family Access
                    </TabsTrigger>
                    <TabsTrigger value="plans" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Available Plans
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="management" className="space-y-6">
                    <Card className="border-none shadow-xl bg-card/50 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <Users className="h-6 w-6 text-primary" />
                                Child Profiles & Access
                            </CardTitle>
                            <CardDescription>
                                Monitor and manage which plans are assigned to each child.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border bg-background/50 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="w-[200px]">Profile</TableHead>
                                            <TableHead>Current Plan</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Expiry Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {/* Child Profiles */}
                                        {childProfiles.map((child) => {
                                            const sub = getChildSubscription(child.id);
                                            return (
                                                <TableRow key={child.id} className="group transition-colors">
                                                    <TableCell className="font-semibold">
                                                        <div className="flex items-center gap-3">
                                                            <div 
                                                                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                                                                style={{ backgroundColor: child.avatarColor || "#6366f1" }}
                                                            >
                                                                {child.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span>{child.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {sub?.plan.name || (
                                                            <span className="text-muted-foreground italic">No Premium Plan</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {sub ? (
                                                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20 transition-all">
                                                                Active
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-muted-foreground">Free</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {sub ? (
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="h-3 w-3" />
                                                                {new Date(sub.endDate).toLocaleDateString()}
                                                            </div>
                                                        ) : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <SubscribePlanButton 
                                                            allPlans={plans}
                                                            userEmail={userEmail}
                                                            userId={userId}
                                                            childProfiles={childProfiles}
                                                            initialChildId={child.id}
                                                            label={sub ? "Change Plan" : "Upgrade Access"}
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
                </TabsContent>

                <TabsContent value="plans" className="space-y-6">
                    <Card className="border-none shadow-xl bg-card/50 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <CreditCard className="h-6 w-6 text-primary" />
                                Available Premium Plans
                            </CardTitle>
                            <CardDescription>
                                Explore our pricing options to unlock the full potential of LOFT.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border bg-background/50 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="w-[250px]">Plan Name</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Key Features</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {/* Free Plan Row */}
                                        <TableRow>
                                            <TableCell className="font-semibold">
                                                <div className="flex flex-col">
                                                    <span>Free Plan</span>
                                                    <span className="text-xs text-muted-foreground font-normal">Basic access</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>GHS 0.00</TableCell>
                                            <TableCell>Lifetime</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge variant="outline" className="flex items-center gap-1 font-normal">
                                                        <Check className="h-3 w-3 text-green-500" />
                                                        Free Flipbooks
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="outline">Included</Badge>
                                            </TableCell>
                                        </TableRow>

                                        {/* Paid Plans */}
                                        {plans.map((plan) => (
                                            <TableRow key={plan.id} className="group transition-colors">
                                                <TableCell className="font-semibold">
                                                    <div className="flex flex-col">
                                                        <span>{plan.name}</span>
                                                        <span className="text-xs text-muted-foreground font-normal line-clamp-1">
                                                            {plan.description}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-bold text-primary">
                                                    GHS {plan.price.toFixed(2)}
                                                </TableCell>
                                                <TableCell>{plan.durationDays} Days</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-2">
                                                        {plan.features?.split("\n").slice(0, 2).map((feature, i) => (
                                                            <Badge key={i} variant="secondary" className="flex items-center gap-1 font-normal bg-primary/5 text-primary-foreground/80">
                                                                <Check className="h-3 w-3 text-primary" />
                                                                {feature}
                                                            </Badge>
                                                        ))}
                                                        {(plan.features?.split("\n")?.length ?? 0) > 2 && (
                                                            <Badge variant="secondary" className="bg-muted text-muted-foreground font-normal">
                                                                +{(plan.features?.split("\n")?.length ?? 0) - 2} more
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <SubscribePlanButton 
                                                        plan={plan}
                                                        userEmail={userEmail}
                                                        userId={userId}
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
                    
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground py-4">
                        <div className="flex items-center gap-1">
                            <Info className="h-4 w-4" />
                            <span>Plans apply per child profile.</span>
                        </div>
                        <div className="h-4 w-px bg-border" />
                        <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            <span>Secure payments powered by Paystack.</span>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
