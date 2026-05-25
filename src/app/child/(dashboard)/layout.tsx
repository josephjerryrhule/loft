import { ReactNode } from "react";
import { getChildSession } from "@/lib/child-auth";
import { redirect } from "next/navigation";
import { LogOut, LayoutDashboard, Library } from "lucide-react";
import { logoutChild } from "@/app/actions/child-auth";
import { Button } from "@/components/ui/button";
import { getSystemSettings } from "@/app/actions/settings";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DashboardAnimations } from "@/components/child/DashboardAnimations";

export default async function ChildDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getChildSession();

  if (!session) {
    redirect("/child/login");
  }

  const settings = await getSystemSettings();
  const logoUrl = settings.logoUrl || "/logo.png";
  const platformName = settings.platformName || "LOFT";

  return (
    <div className="min-h-screen bg-[#FFFAF5] font-quicksand selection:bg-[#E87154]/20 relative overflow-x-hidden">
      {/* Background Animations */}
      <DashboardAnimations />

      {/* TopAppBar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-[#E87154]/10 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Link href="/child" className="flex items-center gap-3 group">
               <div className="relative w-12 h-12 bg-white rounded-2xl shadow-sm border border-[#E87154]/5 flex items-center justify-center p-2 transform group-hover:scale-105 transition-transform duration-300">
                  <img src={logoUrl} alt={platformName} className="w-8 h-8 object-contain" />
               </div>
               <h1 className="text-2xl font-black text-[#E87154] tracking-tight">
                 {platformName}
               </h1>
             </Link>
             
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center ml-10 gap-8">
                <Link href="/child" className="flex items-center gap-2 group">
                  <div className="w-8 h-8 rounded-lg bg-[#E87154]/10 flex items-center justify-center text-[#E87154] group-hover:bg-[#E87154] group-hover:text-white transition-all">
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest text-[#E87154]">Dashboard</span>
                </Link>
                <Link href="/child/library" className="flex items-center gap-2 group">
                  <div className="w-8 h-8 rounded-lg bg-[#BBBBBB]/10 flex items-center justify-center text-[#BBBBBB] group-hover:bg-[#E87154] group-hover:text-white transition-all">
                    <Library className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest text-[#BBBBBB] group-hover:text-[#E87154] transition-colors">Library</span>
                </Link>
              </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-white/90 backdrop-blur-xl border-t border-[#E87154]/10 md:hidden">
        <Link href="/child" className="flex flex-col items-center justify-center text-[#E87154] px-6 py-2">
          <div className="w-6 h-6 mb-1 flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
        </Link>
        <Link href="/child/library" className="flex flex-col items-center justify-center text-[#BBBBBB] px-6 py-2">
          <div className="w-6 h-6 mb-1 flex items-center justify-center">
            <Library className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Library</span>
        </Link>
      </nav>
    </div>
  );
}
