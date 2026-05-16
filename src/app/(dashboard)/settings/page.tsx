import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileSettingsForm } from "@/components/user/ProfileSettingsForm";
import { getSystemSettings } from "@/app/actions/settings";
import { SystemSettingsForm } from "@/components/admin/SystemSettingsForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Role } from "@/lib/types";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { User, Shield, Settings as SettingsIcon } from "lucide-react";

// Force dynamic rendering - this page requires authentication
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/auth/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!user) return <div>User not found</div>;

    const isAdmin = user.role === "ADMIN" || user.role === Role.ADMIN;
    const isOpsManager = user.role === "OPERATIONS_MANAGER" || user.role === Role.OPERATIONS_MANAGER;
    const canSeeSystemSettings = isAdmin || isOpsManager;
    
    let systemSettings = {};
    if (canSeeSystemSettings) {
        systemSettings = await getSystemSettings();
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10 max-w-5xl">
            <PageHeader
                title="Settings"
                subtitle="Manage your professional identity and global platform configurations"
            />

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-8 border-none w-fit h-auto flex flex-wrap shadow-inner gap-1">
                    <TabsTrigger value="profile" className="rounded-lg px-6 py-2.5 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#E87154] data-[state=active]:shadow-sm transition-all gap-2">
                        <User size={16} /> My Profile
                    </TabsTrigger>
                    <TabsTrigger value="security" className="rounded-lg px-6 py-2.5 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#E87154] data-[state=active]:shadow-sm transition-all gap-2">
                        <Shield size={16} /> Security
                    </TabsTrigger>
                    {canSeeSystemSettings && (
                        <TabsTrigger value="system" className="rounded-lg px-6 py-2.5 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#E87154] data-[state=active]:shadow-sm transition-all gap-2">
                            <SettingsIcon size={16} /> System Admin
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="profile" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2rem]">
                        <CardHeader className="p-8 sm:p-10 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="h-6 w-6 rounded-lg bg-[#E87154]/20 flex items-center justify-center">
                                    <User size={12} className="text-[#E87154]" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Personal Account</span>
                            </div>
                            <CardTitle className="text-2xl font-black">My Details</CardTitle>
                            <CardDescription className="text-sm font-medium">Update your public profile and personal communication details.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 sm:p-10">
                            <ProfileSettingsForm user={user} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2rem]">
                        <CardHeader className="p-8 sm:p-10 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="h-6 w-6 rounded-lg bg-[#E87154]/20 flex items-center justify-center">
                                    <Shield size={12} className="text-[#E87154]" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Access Control</span>
                            </div>
                            <CardTitle className="text-2xl font-black">Security</CardTitle>
                            <CardDescription className="text-sm font-medium">Manage your authentication credentials and account protection.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 sm:p-10">
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border-none shadow-inner mb-6">
                                <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Password Management</p>
                                <p className="text-sm text-slate-500 font-medium">Password updates are currently restricted to secure reset links or administrative overrides for enhanced security.</p>
                            </div>
                            <Button variant="outline" className="h-12 px-6 rounded-xl font-bold border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed" disabled>
                                Request Password Rotation
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {canSeeSystemSettings && (
                    <TabsContent value="system" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SystemSettingsForm settings={systemSettings} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
