import { getPlans, getUserSubscriptions } from "@/app/actions/plans";
import { getChildProfiles } from "@/app/actions/children";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/app/actions/settings";
import { ParentPlansView } from "@/components/payment/ParentPlansView";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CustomerPlansPage() {
    const session = await auth();
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;

    if (!userId || !userEmail) return null;

    const [allPlans, activeSubscriptions, childProfiles, user, systemSettings] = await Promise.all([
        getPlans(),
        getUserSubscriptions(userId),
        getChildProfiles(),
        prisma.user.findUnique({
            where: { id: userId },
            select: { country: true, role: true }
        }),
        getSystemSettings(),
    ]);

    return (
        <ParentPlansView
            allPlans={allPlans}
            activeSubscriptions={activeSubscriptions}
            childProfiles={childProfiles}
            userEmail={userEmail}
            userId={userId}
            userRole={user?.role}
            userCountry={user?.country}
            systemSettings={systemSettings}
        />
    );
}
