import { JoinAffiliateForm } from "@/components/auth/JoinAffiliateForm";

interface PageProps {
    params: Promise<{ code: string }>
}

export default async function AffiliateJoinPage({ params }: PageProps) {
  const resolvedParams = await params;
  const managerCode = resolvedParams.code;

  return <JoinAffiliateForm managerCode={managerCode} />;
}
