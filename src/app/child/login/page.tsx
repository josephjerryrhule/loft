import { getSystemSettings } from "@/app/actions/settings";
import LoginForm from "./LoginForm";

export default async function ChildLoginPage() {
  const settings = await getSystemSettings();
  const logoUrl = settings.logoUrl;
  const platformName = settings.platformName;

  return <LoginForm logoUrl={logoUrl} platformName={platformName} />;
}
