import { auth } from "@/auth";
import { Sidebar, MobileNav } from "@/components/layout/Sidebar";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Image from "next/image";

async function getBrandingSettings() {
  try {
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: { in: ["logoUrl", "platformName"] }
      }
    });
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
      try {
        settingsMap[s.key] = JSON.parse(s.value);
      } catch {
        settingsMap[s.key] = s.value;
      }
    });
    return settingsMap;
  } catch {
    return {};
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // @ts-ignore - session.user.role exists in our custom session type
  const userRole = session.user.role;
  const branding = await getBrandingSettings();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-black overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar userRole={userRole} logoUrl={branding.logoUrl} platformName={branding.platformName} />

      <main className="flex-1 flex flex-col h-full w-full overflow-hidden">
         {/* Mobile Header */}
         <div className="md:hidden flex items-center p-4 border-b bg-white dark:bg-slate-900">
             <MobileNav userRole={userRole} logoUrl={branding.logoUrl} platformName={branding.platformName} />
             <div className="flex items-center gap-2 ml-2">
               {branding.logoUrl && (
                 <div className="relative w-6 h-6">
                   <Image src={branding.logoUrl} alt="Logo" fill className="object-contain" />
                 </div>
               )}
               <span className="font-bold">{branding.platformName || "Loft"}</span>
             </div>
         </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
             <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </div>
      </main>
    </div>
  );
}
