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
    let systemSettings = {};
    if (isAdmin) {
        systemSettings = await getSystemSettings();
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account and platform preferences.</p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="profile">My Profile</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    {isAdmin && <TabsTrigger value="system">System Admin</TabsTrigger>}
                </TabsList>

                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your personal details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ProfileSettingsForm user={user} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                     <Card>
                        <CardHeader>
                            <CardTitle>Security</CardTitle>
                            <CardDescription>Manage your password and security settings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground mb-4">
                                Password updates are currently handled via reset link or admin.
                            </div>
                             <Button variant="outline" disabled>Change Password</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="system">
                        <SystemSettingsForm settings={systemSettings} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}


