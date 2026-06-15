import { getApplicantPortalData } from "@/app/actions/recruitment";
import { redirect } from "next/navigation";
import { PortalDashboard } from "./PortalDashboard";

export default async function ApplicantPortalPage({
  params,
}: {
  params: Promise<{ applicantId: string }>;
}) {
  const resolvedParams = await params;
  const { applicantId } = resolvedParams;
  
  const res = await getApplicantPortalData(applicantId);

  if (!res.success || !res.data) {
    redirect("/recruitment/portal");
  }

  return <PortalDashboard initialData={res.data} />;
}
