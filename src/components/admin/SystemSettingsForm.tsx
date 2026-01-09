"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSystemSettings } from "@/app/actions/settings";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface SystemSettingsFormProps {
    settings: Record<string, any>;
}

export function SystemSettingsForm({ settings }: SystemSettingsFormProps) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        try {
            await updateSystemSettings(formData);
            toast.success("Settings updated successfully");
        } catch (error) {
            toast.error("Failed to update settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form action={handleSubmit}>
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="smtp">SMTP / Email</TabsTrigger>
                    <TabsTrigger value="payment">Payment Gateway</TabsTrigger>
                    <TabsTrigger value="commissions">Commissions</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Settings</CardTitle>
                            <CardDescription>Configure basic platform details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="platformName">Platform Name</Label>
                                <Input id="platformName" name="platformName" defaultValue={settings.platformName || "Loft"} placeholder="My Platform" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="supportEmail">Support Email</Label>
                                <Input id="supportEmail" name="supportEmail" defaultValue={settings.supportEmail || ""} placeholder="support@example.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">Currency</Label>
                                <Input id="currency" name="currency" defaultValue={settings.currency || "GHS"} placeholder="GHS" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="smtp">
                    <Card>
                        <CardHeader>
                            <CardTitle>SMTP Configuration</CardTitle>
                            <CardDescription>Settings for sending transactional emails.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="smtpHost">SMTP Host</Label>
                                    <Input id="smtpHost" name="smtpHost" defaultValue={settings.smtpHost || ""} placeholder="smtp.example.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smtpPort">SMTP Port</Label>
                                    <Input id="smtpPort" name="smtpPort" defaultValue={settings.smtpPort || ""} placeholder="587" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="smtpUser">Username</Label>
                                    <Input id="smtpUser" name="smtpUser" defaultValue={settings.smtpUser || ""} placeholder="user" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smtpPass">Password</Label>
                                    <Input id="smtpPass" name="smtpPass" type="password" defaultValue={settings.smtpPass || ""} placeholder="••••••••" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="senderEmail">Sender Email</Label>
                                <Input id="senderEmail" name="senderEmail" defaultValue={settings.senderEmail || ""} placeholder="noreply@example.com" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payment">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Gateway</CardTitle>
                            <CardDescription>Configure Paystack and other payment providers.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <h3 className="text-lg font-medium">Paystack</h3>
                            <div className="space-y-2">
                                <Label htmlFor="paystackPublicKey">Public Key</Label>
                                <Input id="paystackPublicKey" name="paystackPublicKey" defaultValue={settings.paystackPublicKey || ""} placeholder="pk_test_..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paystackSecretKey">Secret Key</Label>
                                <Input id="paystackSecretKey" name="paystackSecretKey" type="password" defaultValue={settings.paystackSecretKey || ""} placeholder="sk_test_..." />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="commissions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Commission Structure</CardTitle>
                            <CardDescription>Configure global commission rates and payout settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="managerCommissionPercentage">Manager Commission (%)</Label>
                                    <Input 
                                        type="number" 
                                        id="managerCommissionPercentage" 
                                        name="managerCommissionPercentage" 
                                        defaultValue={settings.managerCommissionPercentage || "20"} 
                                        placeholder="20" 
                                        min="0"
                                        max="100"
                                    />
                                    <p className="text-[0.8rem] text-muted-foreground">Percentage of order/subscription total.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="affiliateSubscriptionCommission">Affiliate Subscription Commission (Fixed Amount)</Label>
                                    <Input 
                                        type="number" 
                                        id="affiliateSubscriptionCommission" 
                                        name="affiliateSubscriptionCommission" 
                                        defaultValue={settings.affiliateSubscriptionCommission || "10"} 
                                        placeholder="10" 
                                    />
                                    <p className="text-[0.8rem] text-muted-foreground">Fixed amount earned per subscription.</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="minimumPayoutAmount">Minimum Payout Amount (GHS)</Label>
                                <Input 
                                    type="number" 
                                    id="minimumPayoutAmount" 
                                    name="minimumPayoutAmount" 
                                    defaultValue={settings.minimumPayoutAmount || "50"} 
                                    placeholder="50" 
                                    min="0"
                                    step="0.01"
                                />
                                <p className="text-[0.8rem] text-muted-foreground">Minimum approved balance required before affiliates and managers can request payouts.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <div className="mt-6 flex justify-end">
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Settings
                    </Button>
                </div>
            </Tabs>
        </form>
    );
}
