import { redirect } from "next/navigation";

interface PageProps {
    params: Promise<{ code: string }>
}

export default async function CustomerJoinPage({ params }: PageProps) {
    const resolvedParams = await params;
    const code = resolvedParams.code;
    
    // Redirect to registration page with referral code
    redirect(`/auth/register?ref=${code}&role=CUSTOMER`);
}
