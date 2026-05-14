import { getAmbassadorData } from "@/app/actions/user";
import { getSystemSettings } from "@/app/actions/settings";
import { MarketingTools } from "@/components/ambassador/MarketingTools";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AffiliateMarketingPage() {
    const [user, settings] = await Promise.all([
        getAmbassadorData(),
        getSystemSettings()
    ]);

    if (!user) redirect("/auth/login");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Marketing Tools</h1>
                <p className="text-muted-foreground">Download your QR code and ID Badge to represent LOFT officially.</p>
            </div>

            <MarketingTools user={user} logoUrl={settings.logoUrl} />
        </div>
    );
}
