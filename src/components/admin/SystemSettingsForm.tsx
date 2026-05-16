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
import { Loader2, Copy, Check, Upload, X, Image as ImageIcon, Globe, Palette, Mail, CreditCard, PieChart, ShieldCheck, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

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
            formData.set("logoUrl", logoUrl);
            formData.set("faviconUrl", faviconUrl);
            await updateSystemSettings(formData);
            toast.success("System configurations updated");
        } catch (error) {
            toast.error("Failed to update settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form action={handleSubmit}>
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="bg-stone-100 p-1 rounded-xl mb-8 border-none w-full h-auto flex flex-wrap shadow-inner gap-1">
                    <TabsTrigger value="general" className="flex-1 rounded-lg py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-[#E87154] data-[state=active]:shadow-sm transition-all gap-2">
                        <Globe size={16} /> Platform
                    </TabsTrigger>
                    <TabsTrigger value="branding" className="flex-1 rounded-lg py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-[#E87154] data-[state=active]:shadow-sm transition-all gap-2">
                        <Palette size={16} /> Visuals
                    </TabsTrigger>
                    <TabsTrigger value="smtp" className="flex-1 rounded-lg py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-[#E87154] data-[state=active]:shadow-sm transition-all gap-2">
                        <Mail size={16} /> Email
                    </TabsTrigger>
                    <TabsTrigger value="payment" className="flex-1 rounded-lg py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-[#E87154] data-[state=active]:shadow-sm transition-all gap-2">
                        <CreditCard size={16} /> Payments
                    </TabsTrigger>
                    <TabsTrigger value="commissions" className="flex-1 rounded-lg py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-[#E87154] data-[state=active]:shadow-sm transition-all gap-2">
                        <PieChart size={16} /> Rewards
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card className="border-none shadow-md overflow-hidden bg-white rounded-[2rem]">
                        <CardHeader className="p-8 bg-stone-50 border-b border-stone-100">
                            <CardTitle className="text-xl font-black">Platform Settings</CardTitle>
                            <CardDescription className="text-sm font-medium">Basic information and display settings for your platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label htmlFor="platformName" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Platform Name</Label>
                                    <Input id="platformName" name="platformName" defaultValue={settings.platformName || "Loft"} placeholder="My Platform" className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4" />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="currency" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Currency</Label>
                                    <Input id="currency" name="currency" defaultValue={settings.currency || "GHS"} placeholder="GHS" className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="websiteTitle" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">SEO Website Title</Label>
                                <Input id="websiteTitle" name="websiteTitle" defaultValue={settings.websiteTitle || ""} placeholder="The Best Learning Platform" className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4" />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="metaDescription" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Description (SEO)</Label>
                                <Textarea 
                                    id="metaDescription" 
                                    name="metaDescription" 
                                    defaultValue={settings.metaDescription || ""} 
                                    placeholder="A brief description of your platform..."
                                    className="min-h-[100px] bg-stone-50 border-none rounded-2xl font-medium focus-visible:ring-[#E87154] shadow-inner p-4"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="supportEmail" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Support Email</Label>
                                <Input id="supportEmail" name="supportEmail" defaultValue={settings.supportEmail || ""} placeholder="support@example.com" className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="branding" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card className="border-none shadow-md overflow-hidden bg-white rounded-[2rem]">
                        <CardHeader className="p-8 bg-stone-50 border-b border-stone-100">
                            <CardTitle className="text-xl font-black">Visual Identity</CardTitle>
                            <CardDescription className="text-sm font-medium">Customize the platform's appearance with your logo and assets.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-10">
                            {/* Logo Upload */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Platform Logo</Label>
                                <div className="flex flex-col sm:flex-row items-center gap-8 p-6 bg-stone-50 rounded-3xl shadow-inner">
                                    <div className="w-40 h-40 rounded-2xl bg-white border-2 border-dashed border-stone-200 flex items-center justify-center relative overflow-hidden shadow-sm group">
                                        {logoUrl ? (
                                            <>
                                                <img 
                                                    src={logoUrl} 
                                                    alt="Logo" 
                                                    className="object-contain p-4 w-full h-full"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => setLogoUrl("")}
                                                        className="h-10 w-10 rounded-full shadow-lg"
                                                    >
                                                        <X className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <ImageIcon className="h-12 w-12 text-slate-200" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-4 text-center sm:text-left">
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">Main Logo</p>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed">Shown in the sidebar and sign-in screens. High-resolution PNG or SVG with transparency works best.</p>
                                        </div>
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
                                            className="bg-[#E87154] hover:bg-[#D66144] font-black h-11 px-8 rounded-xl shadow-lg shadow-[#E87154]/20 transition-all active:scale-95 text-white"
                                            onClick={() => logoInputRef.current?.click()}
                                            disabled={uploadingLogo}
                                        >
                                            {uploadingLogo ? (
                                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                            ) : (
                                                <Upload className="h-5 w-5 mr-2" />
                                            )}
                                            {logoUrl ? "Replace Logo" : "Upload Logo"}
                                        </Button>
                                    </div>
                                </div>
                                <input type="hidden" name="logoUrl" value={logoUrl} />
                            </div>

                            {/* Favicon Upload */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Browser Icon (Favicon)</Label>
                                <div className="flex flex-col sm:flex-row items-center gap-8 p-6 bg-stone-50 rounded-3xl shadow-inner">
                                    <div className="w-20 h-20 rounded-xl bg-white border-2 border-dashed border-stone-200 flex items-center justify-center relative overflow-hidden shadow-sm group">
                                        {faviconUrl ? (
                                            <>
                                                <img 
                                                    src={faviconUrl} 
                                                    alt="Favicon" 
                                                    className="object-contain p-2 w-full h-full"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => setFaviconUrl("")}
                                                        className="h-8 w-8 rounded-full shadow-lg"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <ImageIcon className="h-8 w-8 text-slate-200" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-4 text-center sm:text-left">
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">Web Icon</p>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed">Shown in browser tabs. Square format (32x32px) recommended.</p>
                                        </div>
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
                                            className="border-stone-200 font-bold h-10 px-6 rounded-lg transition-all"
                                            onClick={() => faviconInputRef.current?.click()}
                                            disabled={uploadingFavicon}
                                        >
                                            {uploadingFavicon ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin text-[#E87154]" />
                                            ) : (
                                                <Upload className="h-4 w-4 mr-2 text-[#E87154]" />
                                            )}
                                            {faviconUrl ? "Replace Icon" : "Upload Icon"}
                                        </Button>
                                    </div>
                                </div>
                                <input type="hidden" name="faviconUrl" value={faviconUrl} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="smtp" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card className="border-none shadow-md overflow-hidden bg-white rounded-[2rem]">
                        <CardHeader className="p-8 bg-stone-50 border-b border-stone-100">
                            <CardTitle className="text-xl font-black">Email Settings</CardTitle>
                            <CardDescription className="text-sm font-medium">Configure how the system sends emails to your members.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label htmlFor="smtpHost" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Mail Server Host</Label>
                                    <Input id="smtpHost" name="smtpHost" defaultValue={settings.smtpHost || ""} placeholder="smtp.example.com" className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4" />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="smtpPort" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Server Port</Label>
                                    <Input id="smtpPort" name="smtpPort" defaultValue={settings.smtpPort || ""} placeholder="587" className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label htmlFor="smtpUser" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Username</Label>
                                    <Input id="smtpUser" name="smtpUser" defaultValue={settings.smtpUser || ""} placeholder="user@domain.com" className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4" />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="smtpPass" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Password</Label>
                                    <PasswordInput id="smtpPass" name="smtpPass" defaultValue={settings.smtpPass || ""} placeholder="••••••••" className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="senderEmail" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Sender Email Address</Label>
                                <Input id="senderEmail" name="senderEmail" defaultValue={settings.senderEmail || ""} placeholder="noreply@loft.com" className="h-12 bg-stone-50 border-none rounded-xl font-bold focus-visible:ring-[#E87154] shadow-inner px-4" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payment" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card className="border-none shadow-md overflow-hidden bg-white rounded-[2rem]">
                        <CardHeader className="p-8 bg-stone-50 border-b border-stone-100">
                            <CardTitle className="text-xl font-black">Payment Settings</CardTitle>
                            <CardDescription className="text-sm font-medium">Connect your payment account to accept membership fees.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-10">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <img src="/paystack-logo.png" alt="Paystack" className="h-6 opacity-80" />
                                    <div className="h-[1px] flex-1 bg-stone-100" />
                                </div>
                                
                                {/* Mode Toggle */}
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Payment Mode</Label>
                                    <div className="flex bg-stone-100 p-1.5 rounded-2xl w-fit shadow-inner">
                                        <button
                                            type="button"
                                            onClick={() => setPaystackMode("test")}
                                            className={cn(
                                                "px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
                                                paystackMode === "test" ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            Sandbox / Testing
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaystackMode("live")}
                                            className={cn(
                                                "px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
                                                paystackMode === "live" ? "bg-[#E87154] text-white shadow-lg shadow-[#E87154]/20" : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            Live / Production
                                        </button>
                                    </div>
                                    <input type="hidden" name="paystackMode" value={paystackMode} />
                                    <div className={cn(
                                        "p-4 rounded-2xl border-2 animate-in pulse duration-1000",
                                        paystackMode === "test" ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-red-50 border-red-100 text-red-700"
                                    )}>
                                        <p className="text-sm font-bold flex items-center gap-2">
                                            <ShieldCheck size={18} />
                                            {paystackMode === "test" 
                                                ? "System is in testing mode. No real money will be charged."
                                                : "ATTENTION: Live mode is active. Real transactions will be processed."
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* Dynamic Keys Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                    {paystackMode === "test" ? (
                                        <>
                                            <div className="space-y-3">
                                                <Label htmlFor="paystackTestPublicKey" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Test Public Key</Label>
                                                <Input id="paystackTestPublicKey" name="paystackTestPublicKey" defaultValue={settings.paystackTestPublicKey || ""} placeholder="pk_test_..." className="h-12 bg-stone-50 border-none rounded-xl font-mono text-sm focus-visible:ring-[#E87154] shadow-inner px-4" />
                                            </div>
                                            <div className="space-y-3">
                                                <Label htmlFor="paystackTestSecretKey" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Test Secret Key</Label>
                                                <PasswordInput id="paystackTestSecretKey" name="paystackTestSecretKey" defaultValue={settings.paystackTestSecretKey || ""} placeholder="sk_test_..." className="h-12 bg-stone-50 border-none rounded-xl font-mono text-sm focus-visible:ring-[#E87154] shadow-inner px-4" />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-3">
                                                <Label htmlFor="paystackLivePublicKey" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Live Public Key</Label>
                                                <Input id="paystackLivePublicKey" name="paystackLivePublicKey" defaultValue={settings.paystackLivePublicKey || ""} placeholder="pk_live_..." className="h-12 bg-stone-50 border-none rounded-xl font-mono text-sm focus-visible:ring-red-500 shadow-inner px-4" />
                                            </div>
                                            <div className="space-y-3">
                                                <Label htmlFor="paystackLiveSecretKey" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Live Secret Key</Label>
                                                <PasswordInput id="paystackLiveSecretKey" name="paystackLiveSecretKey" defaultValue={settings.paystackLiveSecretKey || ""} placeholder="sk_live_..." className="h-12 bg-stone-50 border-none rounded-xl font-mono text-sm focus-visible:ring-red-500 shadow-inner px-4" />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Webhook Configuration */}
                                <div className="space-y-4 border-t pt-8">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Order Sync URL (Webhook)</Label>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="relative flex-1 group">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300 group-hover:text-[#E87154] transition-colors" />
                                            <Input 
                                                value={webhookUrl} 
                                                readOnly 
                                                className="pl-12 h-14 bg-stone-50 border-none rounded-2xl font-mono text-xs text-stone-400 shadow-inner overflow-hidden"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={copyWebhookUrl}
                                            className="h-14 px-8 rounded-2xl bg-slate-900 text-white font-black hover:bg-black transition-all active:scale-95 gap-3 shrink-0"
                                        >
                                            {copied ? (
                                                <Check className="h-5 w-5" />
                                            ) : (
                                                <Copy className="h-5 w-5" />
                                            )}
                                            {copied ? "Link Copied" : "Copy Link"}
                                        </Button>
                                    </div>
                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">
                                        Paste this URL into your Paystack settings to automatically track order payments.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="commissions" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card className="border-none shadow-md overflow-hidden bg-white rounded-[2rem]">
                        <CardHeader className="p-8 bg-stone-50 border-b border-stone-100">
                            <CardTitle className="text-xl font-black">Staff Rewards</CardTitle>
                            <CardDescription className="text-sm font-medium">Set the percentage rates for your ambassador and manager network.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label htmlFor="globalPaidPlanReferralRate" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Ambassador Reward (%)</Label>
                                    <div className="relative">
                                        <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                                        <Input 
                                            type="number" 
                                            id="globalPaidPlanReferralRate" 
                                            name="globalPaidPlanReferralRate" 
                                            defaultValue={settings.globalPaidPlanReferralRate || "20"} 
                                            className="pl-12 h-14 bg-stone-50 border-none rounded-2xl font-black text-xl text-emerald-600 focus-visible:ring-[#E87154] shadow-inner"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                        />
                                    </div>
                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest px-1 leading-relaxed">Reward earned by staff for new member signups.</p>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="operationsManagerOverrideRate" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Ops Lead Rate (%)</Label>
                                    <div className="relative">
                                        <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                                        <Input 
                                            type="number" 
                                            id="operationsManagerOverrideRate" 
                                            name="operationsManagerOverrideRate" 
                                            defaultValue={settings.operationsManagerOverrideRate || "5"} 
                                            className="pl-12 h-14 bg-stone-50 border-none rounded-2xl font-black text-xl text-purple-600 focus-visible:ring-purple-500 shadow-inner"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                        />
                                    </div>
                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest px-1 leading-relaxed">Percentage earned from all network transactions.</p>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="managerOverrideRate" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Manager Rate (%)</Label>
                                    <div className="relative">
                                        <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                                        <Input 
                                            type="number" 
                                            id="managerOverrideRate" 
                                            name="managerOverrideRate" 
                                            defaultValue={settings.managerOverrideRate || settings.managerCommissionPercentage || "3"} 
                                            className="pl-12 h-14 bg-stone-50 border-none rounded-2xl font-black text-xl text-blue-600 focus-visible:ring-blue-500 shadow-inner"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                        />
                                    </div>
                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest px-1 leading-relaxed">Rate earned from their managed network team.</p>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="teamLeaderOverrideRate" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Team Leader Rate (%)</Label>
                                    <div className="relative">
                                        <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" />
                                        <Input 
                                            type="number" 
                                            id="teamLeaderOverrideRate" 
                                            name="teamLeaderOverrideRate" 
                                            defaultValue={settings.teamLeaderOverrideRate || "2"} 
                                            className="pl-12 h-14 bg-stone-50 border-none rounded-2xl font-black text-xl text-indigo-600 focus-visible:ring-indigo-500 shadow-inner"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                        />
                                    </div>
                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest px-1 leading-relaxed">Rate earned for transactions within their direct team.</p>
                                </div>
                            </div>

                            <div className="pt-8 border-t space-y-8">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-stone-50 rounded-3xl shadow-inner border-none">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">Public Leaderboard</p>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">When active, top-performing staff are visible to everyone.</p>
                                    </div>
                                    <div className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            name="leaderboardVisible" 
                                            id="leaderboardVisible"
                                            defaultChecked={settings.leaderboardVisible === "true" || settings.leaderboardVisible === true}
                                            value="true"
                                            className="h-6 w-6 rounded-lg border-stone-300 text-[#E87154] focus:ring-[#E87154] cursor-pointer transition-all"
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-3 max-w-sm">
                                    <Label htmlFor="minimumPayoutAmount" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Minimum for Payout (GHS)</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-stone-300 text-sm tracking-tighter">GHS</span>
                                        <Input 
                                            type="number" 
                                            id="minimumPayoutAmount" 
                                            name="minimumPayoutAmount" 
                                            defaultValue={settings.minimumPayoutAmount || "50"} 
                                            className="pl-14 h-12 bg-stone-50 border-none rounded-xl font-black text-lg focus-visible:ring-[#E87154] shadow-inner"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest px-1">Smallest balance amount required before a withdrawal can be requested.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <div className="mt-8 flex justify-end">
                    <Button type="submit" className="h-14 px-10 rounded-2xl bg-[#E87154] hover:bg-[#D66144] text-white font-black shadow-xl shadow-[#E87154]/20 transition-all active:scale-95 gap-3" disabled={loading}>
                        {loading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <ShieldCheck className="h-6 w-6 text-white" />
                        )}
                        Update Platform Settings
                    </Button>
                </div>
            </Tabs>
        </form>
    );
}
