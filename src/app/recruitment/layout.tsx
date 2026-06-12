import { BookOpen } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { RecruitmentHeader } from "@/components/recruitment/recruitment-header";

export const metadata = {
  title: "Become a LOFT Reading Club Facilitator",
  description:
    "Apply to become a LOFT Reading Club Facilitator. Help children fall in love with reading through fun, interactive sessions.",
};

export default function RecruitmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFAF5] relative selection:bg-[#E87154]/20 selection:text-slate-900">
      {/* Removed grid background as per request */}
      
      {/* Dynamic Floating Pill Nav */}
      <RecruitmentHeader />

      {/* Main Content */}
      <main className="flex-1 relative z-10 pt-28">{children}</main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/50 bg-white/60 backdrop-blur-sm mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 border border-slate-100 overflow-hidden p-1">
                <Image src="/logo-v2.png" alt="LOFT Logo" width={24} height={24} className="object-contain" />
              </div>
              <span className="text-sm font-bold text-slate-700">
                LOFT Reading Club
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              © {new Date().getFullYear()} LOFT. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
