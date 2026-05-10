import { ReactNode } from "react";
import { getChildSession } from "@/lib/child-auth";
import { redirect } from "next/navigation";
import { LogOut, Flame } from "lucide-react";
import { logoutChild } from "@/app/actions/child-auth";
import { Button } from "@/components/ui/button";
import { getSystemSettings } from "@/app/actions/settings";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export default async function ChildDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getChildSession();

  if (!session) {
    redirect("/child/login");
  }

  const settings = await getSystemSettings();
  const logoUrl = settings.logoUrl || "/logo.png";
  const platformName = settings.platformName || "LOFT";

  const child = await prisma.childProfile.findUnique({
    where: { id: session.childId },
    select: { readingStreak: true }
  });
  const streak = child?.readingStreak || 0;

  return (
    <div className="min-h-screen bg-[#FFFAF5] font-quicksand selection:bg-[#E87154]/20">
      {/* TopAppBar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-[#E87154]/10 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="relative w-10 h-10 transform hover:scale-110 transition-transform duration-300">
                <Image src={logoUrl} alt={platformName} fill className="object-contain" />
             </div>
             <h1 className="text-2xl font-black text-[#E87154] tracking-tight">
               {platformName}
             </h1>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Streak Counter - Branded */}
            <div className="hidden sm:flex items-center gap-2 bg-[#E87154]/10 px-4 py-2 rounded-full border border-[#E87154]/20">
              <Flame className="h-5 w-5 text-[#E87154]" fill="currentColor" />
              <span className="font-bold text-[#E87154]">Streak: {streak}</span>
            </div>

            <div className="flex items-center gap-3 border-l border-[#E87154]/10 pl-4 sm:pl-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-[#BBBBBB] uppercase tracking-widest leading-none mb-1">Reader</span>
                <span className="font-black text-lg text-[#2D2D2D] leading-none">{session.username}</span>
              </div>
              <form action={async () => {
                "use server";
                await logoutChild();
                redirect("/child/login");
              }}>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-[#BBBBBB] hover:text-[#E87154] hover:bg-[#E87154]/5 rounded-xl transition-all">
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Logout</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {children}
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-white/90 backdrop-blur-xl border-t border-[#E87154]/10 md:hidden">
        <button className="flex flex-col items-center justify-center text-[#E87154] px-6 py-2">
          <div className="w-6 h-6 mb-1 flex items-center justify-center">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
        </button>
        <button className="flex flex-col items-center justify-center text-[#BBBBBB] px-6 py-2">
          <div className="w-6 h-6 mb-1 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Library</span>
        </button>
      </nav>
    </div>
  );
}
