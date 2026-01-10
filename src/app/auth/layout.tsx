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

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const branding = await getBrandingSettings();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Logo Header */}
      <div className="p-6 flex justify-center">
        {branding.logoUrl ? (
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <Image 
                src={branding.logoUrl} 
                alt={branding.platformName || "Logo"} 
                fill
                className="object-contain"
              />
            </div>
            <span className="text-2xl font-bold">{branding.platformName || "Loft"}</span>
          </div>
        ) : (
          <h1 className="text-2xl font-bold">{branding.platformName || "Loft"}</h1>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
