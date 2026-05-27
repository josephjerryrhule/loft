"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowRight, X, BookOpen } from "lucide-react";
import { gsap } from "gsap";

const books = [
  {
    id: 1,
    title: "Kweku Ananse and the Golden Pot",
    subtitle: "A story of greed and wisdom",
    category: "Ages 4 - 7",
    bgColor: "bg-brand-green",
    textColor: "text-[#302824]",
    heyzineUrl: "https://a.heyzine.com/flip-book/3f7e6f6630.html",
    illustration: (
      <svg viewBox="0 0 100 100" className="w-20 h-20 text-[#302824] opacity-80" stroke="currentColor" fill="none" strokeWidth="2.5">
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
    subtitle: "A quest of courage & heritage",
    category: "Ages 0 - 3",
    bgColor: "bg-brand-purple",
    textColor: "text-[#302824]",
    heyzineUrl: "https://a.heyzine.com/flip-book/3f7e6f6630.html",
    illustration: (
      <svg viewBox="0 0 100 100" className="w-20 h-20 text-[#302824] opacity-80" stroke="currentColor" fill="none" strokeWidth="2.5">
        <path d="M25 45 C35 38, 65 38, 75 45 L72 52 C55 47, 45 47, 28 52 Z" fill="currentColor" />
        <rect x="44" y="52" width="12" height="18" rx="1" />
        <rect x="28" y="70" width="44" height="6" rx="2" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 3,
    title: "Kojo's Twelve Days of Joy",
    subtitle: "A personalized birthday story",
    category: "Ages 4 - 7",
    bgColor: "bg-brand-orange",
    textColor: "text-[#302824]",
    heyzineUrl: "https://a.heyzine.com/flip-book/3f7e6f6630.html",
    illustration: (
      <svg viewBox="0 0 100 100" className="w-20 h-20 text-[#302824] opacity-80" stroke="currentColor" fill="none" strokeWidth="2.5">
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
    subtitle: "Nature's ancient bedtime secrets",
    category: "Ages 8+",
    bgColor: "bg-brand-blue",
    textColor: "text-[#302824]",
    heyzineUrl: "https://a.heyzine.com/flip-book/3f7e6f6630.html",
    illustration: (
      <svg viewBox="0 0 100 100" className="w-20 h-20 text-[#302824] opacity-80" stroke="currentColor" fill="none" strokeWidth="2.5">
        <path d="M45 22 C55 22, 65 30, 65 42 C65 48, 60 55, 52 59 C62 57, 68 48, 68 39 C68 28, 58 18, 45 22 Z" fill="currentColor" />
        <path d="M20 75 Q40 70 60 72 T80 65" strokeLinecap="round" />
        <path d="M40 72 Q45 60 48 55" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 5,
    title: "Yaa Sails the Volta River",
    subtitle: "An adventure down water paths",
    category: "Ages 8+",
    bgColor: "bg-brand-cream",
    textColor: "text-[#302824]",
    heyzineUrl: "https://a.heyzine.com/flip-book/3f7e6f6630.html",
    illustration: (
      <svg viewBox="0 0 100 100" className="w-20 h-20 text-[#302824] opacity-80" stroke="currentColor" fill="none" strokeWidth="2.5">
        <path d="M25 60 L75 60 Q50 75 25 60" fill="currentColor" />
        <path d="M50 15 L50 60 M50 20 L70 38 L50 38" strokeLinejoin="round" />
        <path d="M15 78 Q30 73 50 78 T85 78" strokeLinecap="round" />
      </svg>
    )
  }
];

// Triple cards list to allow a seamless looping marquee
const marqueeBooks = [...books, ...books, ...books];

export default function Stories() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const [activeBook, setActiveBook] = useState(books[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // A high-performance Ref to capture the closest book in the viewport center
  const closestBookRef = useRef(books[0]);

  useEffect(() => {
    const track = trackRef.current;
    const container = containerRef.current;
    if (!track || !container) return;

    const ctx = gsap.context(() => {
      // 1. Loop translation marquee
      const tween = gsap.to(track, {
        xPercent: -33.333, // Translate by 1/3 since we have 3 sets of cards
        ease: "none",
        duration: 35, // Speed of movement
        repeat: -1,
      });

      tweenRef.current = tween;

      // 2. GSAP Ticker handles checking proximity to center to "pop" cards
      const tickHandler = () => {
        const containerRect = container.getBoundingClientRect();
        const containerCenter = containerRect.left + containerRect.width / 2;
        const cards = track.querySelectorAll(".book-card");

        let minDistance = Infinity;
        let closestBook = books[0];

        cards.forEach((card) => {
          const cardRect = card.getBoundingClientRect();
          const cardCenter = cardRect.left + cardRect.width / 2;
          const distance = Math.abs(containerCenter - cardCenter);
          const maxDistance = 250; // Distance window for scale trigger

          let scale = 0.85;
          let opacity = 0.6;

          if (distance < maxDistance) {
            const ratio = (maxDistance - distance) / maxDistance; // 1 at center, 0 at boundary
            scale = 0.85 + ratio * 0.20; // Pops out to 1.05
            opacity = 0.6 + ratio * 0.4;  // Increases to 1.0
          }

          // Track the closest book to set for button clicks
          if (distance < minDistance) {
            minDistance = distance;
            const bookId = card.getAttribute("data-book-id");
            const found = books.find((b) => b.id.toString() === bookId);
            if (found) closestBook = found;
          }

          gsap.set(card, {
            scale: scale,
            opacity: opacity,
            zIndex: distance < 120 ? 30 : (distance < 240 ? 20 : 10),
            overwrite: "auto",
          });
        });

        closestBookRef.current = closestBook;
      };

      gsap.ticker.add(tickHandler);

      return () => {
        gsap.ticker.remove(tickHandler);
      };
    });

    return () => ctx.revert();
  }, []);

  const handleMouseEnter = () => {
    if (tweenRef.current) {
      gsap.to(tweenRef.current, { timeScale: 0, duration: 0.5, ease: "power1.out" });
    }
  };

  const handleMouseLeave = () => {
    if (tweenRef.current) {
      gsap.to(tweenRef.current, { timeScale: 1, duration: 0.5, ease: "power1.out" });
    }
  };

  const openBookModal = (book: typeof books[0]) => {
    setActiveBook(book);
    setIsModalOpen(true);
  };

  const handleCtaClick = () => {
    // Open the book that is currently closest to the center
    openBookModal(closestBookRef.current);
  };

  return (
    <section id="stories" className="w-full py-20 bg-white border-b border-brand-coral/5 overflow-hidden">
      <div className="mx-auto max-w-7xl min-[1700px]:max-w-[100rem] px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black text-[#302824] bg-[#FFD02B] border-2 border-[#302824] shadow-sm animate-pulse">
            <Sparkles className="w-3.5 h-3.5 fill-[#302824]" />
            Free Library Preview
          </div>
          <h2 className="text-3xl sm:text-5xl text-text-dark font-quicksand font-bold tracking-tight">
            Stories Where Children See Themselves
          </h2>
          <p className="text-base sm:text-lg text-text-muted font-medium max-w-2xl mx-auto leading-relaxed">
            Explore our free interactive children's stories online. Hover to slow down, and tap any book to start reading in 3D flipbook style immediately.
          </p>
        </div>

        {/* Continuous Looped Book Carousel */}
        <div 
          ref={containerRef}
          className="relative w-full overflow-visible py-8 cursor-grab active:cursor-grabbing flex justify-center items-center h-[420px]"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Side shadows to blend */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div
            ref={trackRef}
            className="marquee-track flex gap-3 items-center w-max overflow-visible"
          >
            {marqueeBooks.map((book, idx) => {
              return (
                <div
                  key={`${book.id}-${idx}`}
                  data-book-id={book.id}
                  onClick={() => openBookModal(book)}
                  className="book-card flex-shrink-0 w-[210px] sm:w-[250px] h-[300px] sm:h-[350px] p-6 rounded-3xl border-3 border-[#302824] flex flex-col justify-between shadow-soft cursor-pointer hover:shadow-lg transition-shadow bg-white"
                  style={{ backgroundColor: "white" }}
                >
                  {/* Card Background Block wrapper */}
                  <div className={`absolute inset-0 rounded-2xl ${book.bgColor} opacity-15 -z-10`} />
                  
                  {/* Cover Header */}
                  <div className="flex justify-between items-center pb-2">
                    <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border border-[#302824]/20 shadow-sm ${book.bgColor} text-text-dark`}>
                      {book.category}
                    </span>
                    <BookOpen className="w-4 h-4 text-[#302824]/75" />
                  </div>

                  {/* Illustration Body */}
                  <div className="flex-1 flex items-center justify-center py-4">
                    {book.illustration}
                  </div>

                  {/* Cover Footer */}
                  <div className="space-y-1 border-t-2 border-[#302824]/10 pt-3">
                    <h3 className="text-xs sm:text-sm font-quicksand font-extrabold text-text-dark leading-tight line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-[9px] font-bold text-text-muted leading-tight line-clamp-1">
                      {book.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Unified Callout & CTA Banner */}
        <div className="mt-16 max-w-5xl mx-auto rounded-[2rem] border-3 border-[#302824] bg-[#C2D5A8] p-8 sm:p-10 md:p-12 relative overflow-visible shadow-soft">
          
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
                  className="inline-flex items-center justify-between pl-6 pr-2 py-2 rounded-full font-quicksand font-black text-[#302824] bg-white border-2 border-[#302824] hover:bg-[#FAF5EF] transition-all shadow-sm btn-springy group cursor-pointer text-sm sm:text-base w-full sm:w-auto"
                >
                  <span className="mr-6">Join Platform</span>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#E87154] border border-[#302824]/20 flex items-center justify-center text-white transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </a>
                
                <button
                  onClick={handleCtaClick}
                  className="font-quicksand font-black text-[#302824]/80 hover:text-[#302824] hover:underline transition-colors cursor-pointer text-sm sm:text-base py-2 px-4"
                >
                  Read Free Story
                </button>
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

      {/* Heyzine Flipbook Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#302824]/90 backdrop-blur-md">
          <div className="relative w-full max-w-5xl h-[85vh] bg-[#FAF5EF] border-4 border-[#302824] rounded-3xl shadow-soft flex flex-col overflow-hidden animate-[scaleUp_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
            <style>{`
              @keyframes scaleUp {
                from { transform: scale(0.95); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
              }
            `}</style>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#302824] bg-white">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black text-brand-coral tracking-wider leading-none">
                  LOFT Free Library
                </span>
                <h4 className="text-lg font-quicksand font-extrabold text-text-dark mt-1">
                  {activeBook.title}
                </h4>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full border-2 border-[#302824] bg-white hover:bg-brand-cream text-[#302824] transition cursor-pointer hover:scale-105 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body (Heyzine Embed Iframe) */}
            <div className="flex-1 bg-[#FAF5EF] relative p-2">
              <iframe
                src={activeBook.heyzineUrl}
                className="w-full h-full border-none rounded-xl bg-white"
                allowFullScreen
                title={activeBook.title}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
