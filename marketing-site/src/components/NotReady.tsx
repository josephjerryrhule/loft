"use client";

import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";

export default function NotReady() {
  return (
    <section id="not-ready" className="w-full py-16 bg-white overflow-visible">
      <div className="max-w-7xl mx-auto px-6 overflow-visible">
        
        {/* Unified Callout & CTA Banner */}
        <div className="max-w-5xl mx-auto rounded-[2rem] border-3 border-[#302824] bg-[#C2D5A8] p-8 sm:p-10 md:p-12 relative overflow-visible shadow-soft">
          
          {/* Subtle background sparkles */}
          <div className="absolute top-4 left-4 opacity-15 pointer-events-none">
            <Sparkles className="w-8 h-8 text-[#302824]" />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left side content */}
            <div className="lg:col-span-8 space-y-4 text-center lg:text-left">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-quicksand font-black text-[#302824] leading-tight">
                Not Ready To Subscribe Yet? Get Five Free Stories…
              </h3>
              <p className="text-sm sm:text-base font-semibold text-[#302824]/85 leading-relaxed font-inter max-w-2xl">
                Start your Land of Fairy Tales journey with five enchanting African bedtime tales delivered instantly when you join — no commitment, just pure bedtime magic to share with your child.
              </p>
              
              {/* CTAs Row */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <a
                  href="https://app.landoffairytales.com/auth/register?planId=free-plan-default"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-between pl-6 pr-2 py-2 rounded-full font-quicksand font-black text-text-dark bg-white border-2 border-[#302824] hover:bg-[#FAF5EF] transition-all shadow-sm btn-springy group cursor-pointer text-sm sm:text-base w-full sm:w-auto"
                >
                  <span className="mr-6">Join Platform</span>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#E87154] border border-[#302824]/20 flex items-center justify-center text-white transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </a>
                
                <a
                  href="#stories"
                  className="font-quicksand font-black text-[#302824]/80 hover:text-[#302824] hover:underline transition-colors text-sm sm:text-base py-2 px-4"
                >
                  Read Free Story
                </a>
              </div>
            </div>

            {/* Right side overlapping 3D Book */}
            <div className="lg:col-span-4 relative h-full hidden lg:block select-none">
              <div className="absolute -top-24 -bottom-24 right-4 w-[220px] flex items-center justify-center perspective-[1000px] pointer-events-none">
                <div 
                  className="relative w-[170px] h-[250px] rounded-r-2xl border-3 border-[#302824] bg-white shadow-2xl transition-all duration-500 hover:rotate-y-[-10deg] hover:translate-x-2"
                  style={{
                    transform: "rotateY(-20deg) rotateX(12deg) rotateZ(-4deg)",
                    transformStyle: "preserve-3d",
                    boxShadow: "-12px 18px 28px rgba(48,40,36,0.18)"
                  }}
                >
                  {/* Spine effect */}
                  <div className="absolute top-0 left-0 w-3.5 h-full bg-[#302824]/10 border-r border-[#302824]/20 rounded-l-md" />
                  
                  {/* Book Cover Content */}
                  <div className="w-full h-full p-4 flex flex-col justify-between bg-[#FAF5EF] rounded-r-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-[7px] font-black bg-brand-purple border border-[#302824] px-1.5 py-0.5 rounded-full text-text-dark">
                        PREVIEW
                      </span>
                      <Sparkles className="w-3 h-3 text-[#302824] animate-pulse" />
                    </div>
                    <div className="flex-1 flex items-center justify-center my-3 text-brand-coral">
                      <svg viewBox="0 0 100 100" className="w-14 h-14 opacity-90" stroke="currentColor" fill="none" strokeWidth="2.5">
                        <circle cx="50" cy="55" r="18" />
                        <path d="M40 37 L60 37 M45 37 L45 32 Q50 28 55 32 L55 37" />
                        <circle cx="50" cy="22" r="3" fill="currentColor" />
                      </svg>
                    </div>
                    <div className="border-t border-[#302824]/10 pt-2 text-left">
                      <h4 className="text-[9px] font-quicksand font-black text-text-dark leading-tight line-clamp-2">
                        Ananse & the Golden Pot
                      </h4>
                    </div>
                  </div>

                  {/* Pages edge effect */}
                  <div 
                    className="absolute top-[4px] bottom-[4px] right-[-8px] w-[8px] bg-white border-y border-r-2 border-[#302824] rounded-r-md"
                    style={{
                      transform: "translateZ(-1px)"
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
