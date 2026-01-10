import { getAffiliateLinks } from "@/app/actions/affiliate";
import { CopyInviteLinkButton } from "@/components/affiliate/CopyInviteLinkButton";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

// Force dynamic rendering - this page requires authentication and real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AffiliateLinksPage() {
    const links = await getAffiliateLinks();

    if (!links) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Invite Links</h1>
                <p className="text-muted-foreground">Share these links to earn commissions from referrals.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Customer Referral Link</CardTitle>
                        <CardDescription>Share this link with potential customers. You'll earn commissions on their signups, product purchases, and subscriptions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                            {links.customerLink}
                        </div>
                        <CopyInviteLinkButton text={links.customerLink} label="Copy Customer Link" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Affiliate Invite Link</CardTitle>
                        <CardDescription>Invite others to join your team as affiliates. Managers earn bonuses from their team's activity.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                            {links.affiliateLink}
                        </div>
                        <CopyInviteLinkButton text={links.affiliateLink} label="Copy Affiliate Link" />
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Your Referral Code</CardTitle>
                    <CardDescription>Your unique code that can be used during registration.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-lg">
                        <span className="text-2xl font-bold tracking-widest">{links.referralCode}</span>
                        <CopyInviteLinkButton text={links.referralCode || ""} label="Copy Code" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
