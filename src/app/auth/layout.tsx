import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { Sparkles } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-[#FFFAF5] transition-colors duration-500">
      {/* Navigation Header */}
      <div className="p-8 flex justify-center relative z-10">
        <div className="flex items-center gap-4 group">
            {branding.logoUrl ? (
                <div className="relative w-12 h-12 p-1.5 bg-white rounded-2xl shadow-sm border border-stone-100 transition-transform group-hover:rotate-6 duration-300">
                    <img 
                        src={branding.logoUrl} 
                        alt={branding.platformName || "Logo"} 
                        className="object-contain w-full h-full"
                    />
                </div>
            ) : (
                <div className="h-12 w-12 rounded-2xl bg-[#E87154] flex items-center justify-center text-white shadow-md">
                    <Sparkles size={24} />
                </div>
            )}
            <span className="text-3xl font-black tracking-tighter text-stone-900 uppercase">{branding.platformName || "Loft"}</span>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-4 pb-12 sm:pb-20">
        <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {children}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="p-8 text-center relative z-10">
         <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400 opacity-60 flex items-center justify-center gap-4">
            <span>Welcome to the Land of Fairy Tales</span>
         </p>
      </div>
    </div>
  );
}
