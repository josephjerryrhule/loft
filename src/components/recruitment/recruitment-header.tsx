"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CheckStatusModal } from "./check-status-modal";

export function RecruitmentHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // If we scroll past 50px, change to the light theme
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    // Initial check
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none transition-all duration-300">
      <header 
        className={`pointer-events-auto backdrop-blur-md rounded-full px-2 py-2 flex items-center gap-6 w-fit border transition-all duration-300 ${
          scrolled 
            ? "bg-white/95 border-slate-200 shadow-md" 
            : "bg-white/10 border-white/20 shadow-[0_2px_10px_rgba(0,0,0,0.1),0_0_1px_rgba(255,255,255,0.2)]"
        }`}
      >
        <Link href="/recruitment" className="flex items-center group pl-1">
          <div className={`w-10 h-10 relative rounded-full overflow-hidden flex items-center justify-center p-1 transition-colors duration-300 ${scrolled ? 'bg-slate-50 border border-slate-100' : 'bg-white/20 backdrop-blur-sm'}`}>
            <Image src="/logo-v2.png" alt="LOFT Logo" width={32} height={32} className="object-contain" />
          </div>
        </Link>
        
        <div className="flex items-center gap-3 pr-1">
          {/* Check Status Button triggers the Modal */}
          <CheckStatusModal 
            triggerButton={
              <Button 
                variant="ghost" 
                className={`text-sm font-bold rounded-full transition-colors duration-300 ${
                  scrolled 
                    ? "text-slate-600 hover:bg-slate-100" 
                    : "text-white/90 hover:bg-white/20 hover:text-white"
                }`}
              >
                Check Status
              </Button>
            } 
          />
          
          <Link href="/recruitment/apply">
            <Button className="bg-[#E87154] hover:bg-[#D66144] text-white font-bold px-6 py-2 rounded-full transition-transform hover:scale-105 active:scale-95 shadow-sm shadow-[#E87154]/20 border border-[#E87154]">
              Apply Now
            </Button>
          </Link>
        </div>
      </header>
    </div>
  );
}
