"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSystemSettings } from "@/app/actions/settings";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { Loader2, Copy, Check, Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface SystemSettingsFormProps {
    settings: Record<string, any>;
}

export function SystemSettingsForm({ settings }: SystemSettingsFormProps) {
    const [loading, setLoading] = useState(false);
    const [paystackMode, setPaystackMode] = useState<"test" | "live">(
        settings.paystackMode || "test"
    );
    const [copied, setCopied] = useState(false);
    const [logoUrl, setLogoUrl] = useState(settings.logoUrl || "");
    const [faviconUrl, setFaviconUrl] = useState(settings.faviconUrl || "");
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingFavicon, setUploadingFavicon] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    const webhookUrl = typeof window !== "undefined" 
        ? `${window.location.origin}/api/webhooks/paystack`
        : "";

    const copyWebhookUrl = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        toast.success("Webhook URL copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFileUpload = async (file: File, type: "logo" | "favicon") => {
        const setUploading = type === "logo" ? setUploadingLogo : setUploadingFavicon;
        const setUrl = type === "logo" ? setLogoUrl : setFaviconUrl;
        
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", "branding");
            
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            
            if (!response.ok) throw new Error("Upload failed");
            
            const data = await response.json();
            setUrl(data.url);
            toast.success(`${type === "logo" ? "Logo" : "Favicon"} uploaded successfully`);
        } catch (error) {
            toast.error(`Failed to upload ${type}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        try {
            // Add logo and favicon URLs to form data
            formData.set("logoUrl", logoUrl);
            formData.set("faviconUrl", faviconUrl);
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
                <TabsList className="grid w-full grid-cols-5 mb-8">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="branding">Branding</TabsTrigger>
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
                                <Label htmlFor="websiteTitle">Website Title</Label>
                                <Input id="websiteTitle" name="websiteTitle" defaultValue={settings.websiteTitle || ""} placeholder="My Platform - The Best Learning Platform" />
                                <p className="text-[0.8rem] text-muted-foreground">This will be shown in browser tabs and search results.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="metaDescription">Meta Description</Label>
                                <Textarea 
                                    id="metaDescription" 
                                    name="metaDescription" 
                                    defaultValue={settings.metaDescription || ""} 
                                    placeholder="A comprehensive learning platform for digital products and courses..."
                                    rows={3}
                                />
                                <p className="text-[0.8rem] text-muted-foreground">SEO description shown in search results (recommended: 150-160 characters).</p>
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

                <TabsContent value="branding">
                    <Card>
                        <CardHeader>
                            <CardTitle>Branding</CardTitle>
                            <CardDescription>Upload your logo and favicon for the platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Logo Upload */}
                            <div className="space-y-3">
                                <Label>Platform Logo</Label>
                                <div className="flex items-start gap-4">
                                    <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30 relative overflow-hidden">
                                        {logoUrl ? (
                                            <>
                                                <img 
                                                    src={logoUrl} 
                                                    alt="Logo" 
                                                    className="object-contain p-2 w-full h-full"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setLogoUrl("")}
                                                    className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 hover:bg-destructive/80"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </>
                                        ) : (
                                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            ref={logoInputRef}
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleFileUpload(file, "logo");
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => logoInputRef.current?.click()}
                                            disabled={uploadingLogo}
                                        >
                                            {uploadingLogo ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Upload className="h-4 w-4 mr-2" />
                                            )}
                                            Upload Logo
                                        </Button>
                                        <p className="text-[0.8rem] text-muted-foreground">
                                            Recommended: 200x200px, PNG or SVG
                                        </p>
                                    </div>
                                </div>
                                <input type="hidden" name="logoUrl" value={logoUrl} />
                            </div>

                            {/* Favicon Upload */}
                            <div className="space-y-3">
                                <Label>Favicon</Label>
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30 relative overflow-hidden">
                                        {faviconUrl ? (
                                            <>
                                                <img 
                                                    src={faviconUrl} 
                                                    alt="Favicon" 
                                                    className="object-contain p-1 w-full h-full"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setFaviconUrl("")}
                                                    className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 hover:bg-destructive/80"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </>
                                        ) : (
                                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <input
                                            type="file"
                                            ref={faviconInputRef}
                                            accept="image/*,.ico"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleFileUpload(file, "favicon");
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => faviconInputRef.current?.click()}
                                            disabled={uploadingFavicon}
                                        >
                                            {uploadingFavicon ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Upload className="h-4 w-4 mr-2" />
                                            )}
                                            Upload Favicon
                                        </Button>
                                        <p className="text-[0.8rem] text-muted-foreground">
                                            Recommended: 32x32px or 64x64px, ICO or PNG
                                        </p>
                                    </div>
                                </div>
                                <input type="hidden" name="faviconUrl" value={faviconUrl} />
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
                                    <PasswordInput id="smtpPass" name="smtpPass" defaultValue={settings.smtpPass || ""} placeholder="••••••••" />
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
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Paystack Configuration</h3>
                                
                                {/* Mode Toggle */}
                                <div className="space-y-2">
                                    <Label>Environment Mode</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={paystackMode === "test" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setPaystackMode("test")}
                                        >
                                            Test Mode
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={paystackMode === "live" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setPaystackMode("live")}
                                        >
                                            Live Mode
                                        </Button>
                                    </div>
                                    <input type="hidden" name="paystackMode" value={paystackMode} />
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        {paystackMode === "test" 
                                            ? "Using test keys for development and testing"
                                            : "⚠️ Using live keys - real transactions will be processed"
                                        }
                                    </p>
                                </div>

                                {/* Test Keys */}
                                {paystackMode === "test" && (
                                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                                        <h4 className="font-medium text-sm">Test API Keys</h4>
                                        <div className="space-y-2">
                                            <Label htmlFor="paystackTestPublicKey">Test Public Key</Label>
                                            <Input 
                                                id="paystackTestPublicKey" 
                                                name="paystackTestPublicKey" 
                                                defaultValue={settings.paystackTestPublicKey || ""} 
                                                placeholder="pk_test_..." 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="paystackTestSecretKey">Test Secret Key</Label>
                                            <PasswordInput 
                                                id="paystackTestSecretKey" 
                                                name="paystackTestSecretKey" 
                                                defaultValue={settings.paystackTestSecretKey || ""} 
                                                placeholder="sk_test_..." 
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Live Keys */}
                                {paystackMode === "live" && (
                                    <div className="space-y-4 p-4 border rounded-lg bg-destructive/5 border-destructive/20">
                                        <h4 className="font-medium text-sm text-destructive">Live API Keys</h4>
                                        <div className="space-y-2">
                                            <Label htmlFor="paystackLivePublicKey">Live Public Key</Label>
                                            <Input 
                                                id="paystackLivePublicKey" 
                                                name="paystackLivePublicKey" 
                                                defaultValue={settings.paystackLivePublicKey || ""} 
                                                placeholder="pk_live_..." 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="paystackLiveSecretKey">Live Secret Key</Label>
                                            <PasswordInput 
                                                id="paystackLiveSecretKey" 
                                                name="paystackLiveSecretKey" 
                                                defaultValue={settings.paystackLiveSecretKey || ""} 
                                                placeholder="sk_live_..." 
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Webhook URL */}
                                <div className="space-y-2">
                                    <Label>Webhook URL</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={webhookUrl} 
                                            readOnly 
                                            className="font-mono text-sm"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={copyWebhookUrl}
                                        >
                                            {copied ? (
                                                <Check className="h-4 w-4" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        Add this URL to your Paystack dashboard under Settings → Webhooks
                                    </p>
                                </div>
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
                            <div className="space-y-2">
                                <Label htmlFor="signupBonus">Signup Bonus (Fixed Amount)</Label>
                                <Input 
                                    type="number" 
                                    id="signupBonus" 
                                    name="signupBonus" 
                                    defaultValue={settings.signupBonus || "5"} 
                                    placeholder="5" 
                                    min="0"
                                    step="0.01"
                                />
                                <p className="text-[0.8rem] text-muted-foreground">Fixed amount earned per customer signup.</p>
                            </div>
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
                                    <p className="text-[0.8rem] text-muted-foreground">Minimum approved balance required to request payouts.</p>
                                </div>
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
