import { getPlans, getUserSubscription } from "@/app/actions/plans";
import { auth } from "@/auth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { SubscribePlanButton } from "@/components/payment/SubscribePlanButton";

// Force dynamic rendering - this page requires authentication and real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CustomerPlansPage() {
    const session = await auth();
    const allPlans = await getPlans();
    // Filter out free plan since we have a hardcoded card for it
    const plans = allPlans
        .filter(plan => Number(plan.price) > 0)
        .map(plan => ({
            ...plan,
            price: Number(plan.price),
            affiliateCommissionPercentage: plan.affiliateCommissionPercentage 
                ? Number(plan.affiliateCommissionPercentage) 
                : null
        }));
    const currentSubscription = session?.user?.id 
        ? await getUserSubscription(session.user.id) 
        : null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
                <p className="text-muted-foreground">Choose a plan to unlock premium content.</p>
            </div>

            {currentSubscription && (
                <Card className="bg-primary/5 border-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-primary" />
                            Current Plan: {currentSubscription.plan.name}
                        </CardTitle>
                        <CardDescription>
                            Valid until {new Date(currentSubscription.endDate).toLocaleDateString()}
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Free Plan Card */}
                <Card className={!currentSubscription ? "border-primary" : ""}>
                    <CardHeader>
                        <CardTitle>Free Plan</CardTitle>
                        <CardDescription>Basic access to free content</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold mb-4">GHS 0.00</div>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                Access to free flipbooks
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                Basic support
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        {!currentSubscription ? (
                            <Badge variant="outline">Current Plan</Badge>
                        ) : null}
                    </CardFooter>
                </Card>

                {/* Paid Plans */}
                {plans.map((plan) => (
                    <Card key={plan.id} className={currentSubscription?.planId === plan.id ? "border-primary" : ""}>
                        <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold mb-4">
                                GHS {Number(plan.price).toFixed(2)}
                                <span className="text-sm font-normal text-muted-foreground">/{plan.durationDays} days</span>
                            </div>
                            {plan.features && (
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    {plan.features.split("\n").map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-500" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                        <CardFooter>
                            {currentSubscription?.planId === plan.id ? (
                                <Badge variant="outline">Current Plan</Badge>
                            ) : (
                                session?.user?.email && session?.user?.id && (
                                    <SubscribePlanButton 
                                        plan={plan}
                                        userEmail={session.user.email}
                                        userId={session.user.id}
                                    />
                                )
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
