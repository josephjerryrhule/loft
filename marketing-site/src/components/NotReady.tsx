"use client";
import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight } from "lucide-react";

const fallbackBooks = [
  {
    id: 1,
    title: "Kweku Ananse and the Golden Pot",
    illustration: (
      <svg viewBox="0 0 100 100" className="w-14 h-14 opacity-90" stroke="currentColor" fill="none" strokeWidth="2.5">
        <circle cx="50" cy="55" r="18" />
        <path d="M40 37 L60 37 M45 37 L45 32 Q50 28 55 32 L55 37" />
        <path d="M32 55 Q20 48 18 35 M32 58 Q16 58 14 50 M32 62 Q18 68 18 72" />
        <path d="M68 55 Q80 48 82 35 M68 58 Q84 58 86 50 M68 62 Q82 68 82 72" />
        <circle cx="50" cy="22" r="3" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 2,
    title: "Ama's Magical Ashanti Stool",
    illustration: (
      <svg viewBox="0 0 100 100" className="w-14 h-14 opacity-90" stroke="currentColor" fill="none" strokeWidth="2.5">
        <path d="M25 45 C35 38, 65 38, 75 45 L72 52 C55 47, 45 47, 28 52 Z" fill="currentColor" />
        <rect x="44" y="52" width="12" height="18" rx="1" />
        <rect x="28" y="70" width="44" height="6" rx="2" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 3,
    title: "Kojo's Twelve Days of Joy",
    illustration: (
      <svg viewBox="0 0 100 100" className="w-14 h-14 opacity-90" stroke="currentColor" fill="none" strokeWidth="2.5">
        <circle cx="50" cy="40" r="14" />
        <line x1="50" y1="20" x2="50" y2="12" strokeLinecap="round" />
        <line x1="50" y1="60" x2="50" y2="68" strokeLinecap="round" />
        <line x1="30" y1="40" x2="22" y2="40" strokeLinecap="round" />
        <line x1="70" y1="40" x2="78" y2="40" strokeLinecap="round" />
        <rect x="40" y="72" width="20" height="14" rx="1" />
        <line x1="50" y1="72" x2="50" y2="86" />
      </svg>
    )
  },
  {
    id: 4,
    title: "The Baobab Tree Whispers",
    illustration: (
      <svg viewBox="0 0 100 100" className="w-14 h-14 opacity-90" stroke="currentColor" fill="none" strokeWidth="2.5">
        <path d="M45 22 C55 22, 65 30, 65 42 C65 48, 60 55, 52 59 C62 57, 68 48, 68 39 C68 28, 58 18, 45 22 Z" fill="currentColor" />
        <path d="M20 75 Q40 70 60 72 T80 65" strokeLinecap="round" />
        <path d="M40 72 Q45 60 48 55" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 5,
    title: "Yaa Sails the Volta River",
    illustration: (
      <svg viewBox="0 0 100 100" className="w-14 h-14 opacity-90" stroke="currentColor" fill="none" strokeWidth="2.5">
        <path d="M25 60 L75 60 Q50 75 25 60" fill="currentColor" />
        <path d="M50 15 L50 60 M50 20 L70 38 L50 38" strokeLinejoin="round" />
        <path d="M15 78 Q30 73 50 78 T85 78" strokeLinecap="round" />
      </svg>
    )
  }
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://app.landoffairytales.com";

export default function NotReady() {
  const [selectedBook, setSelectedBook] = useState<any>(fallbackBooks[0]);

  useEffect(() => {
    async function fetchRandomFlipbook() {
      const urls = [
        "http://localhost:3000/api/flipbooks",
        `${API_BASE_URL}/api/flipbooks`,
      ];

      for (const url of urls) {
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              const randomIndex = Math.floor(Math.random() * data.length);
              const book = data[randomIndex];

              const urlObj = new URL(url);
              const activeOrigin = urlObj.origin;
              const coverUrl = book.coverImageUrl 
                ? (book.coverImageUrl.startsWith("http") ? book.coverImageUrl : `${activeOrigin}${book.coverImageUrl}`)
                : null;

              const illustrations = fallbackBooks.map((b) => b.illustration);
              const fallbackIllustration = illustrations[randomIndex % illustrations.length];

              setSelectedBook({
                id: book.id,
                title: book.title,
                coverImageUrl: coverUrl,
                illustration: fallbackIllustration,
              });
              return;
            }
          }
        } catch (err) {
          // Continue to next URL
        }
      }

      // Fallback
      const randomFallbackIndex = Math.floor(Math.random() * fallbackBooks.length);
      setSelectedBook(fallbackBooks[randomFallbackIndex]);
    }

    fetchRandomFlipbook();
  }, []);

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
                    <div className="flex-1 flex items-center justify-center my-3 text-brand-coral select-none pointer-events-none">
                      {selectedBook.coverImageUrl ? (
                        <img
                          src={selectedBook.coverImageUrl}
                          alt={selectedBook.title}
                          className="w-auto h-24 object-contain rounded-lg border border-[#302824]/10 shadow-sm"
                        />
                      ) : (
                        selectedBook.illustration
                      )}
                    </div>
                    <div className="border-t border-[#302824]/10 pt-2 text-left">
                      <h4 className="text-[9px] font-quicksand font-black text-text-dark leading-tight line-clamp-2">
                        {selectedBook.title}
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
