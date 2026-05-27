"use client";

import React, { useState } from "react";
import { Gift, ArrowRight, Sparkles } from "lucide-react";
import { GreenBlob, PurpleBlob, OrangeBlob, CoralBlob } from "./CharacterBlobs";

interface CoverCard {
  id: string;
  title: string;
  desc: string;
  bg: string;
  border: string;
  text: string;
  rotate: string;
  translateY: string;
  translateX: string;
  character: "green" | "purple" | "orange" | "coral";
  greeting: string;
  illustration: React.ReactNode;
}

export default function BirthdayBooks() {
  const [name, setName] = useState("Ama");

  const cards: CoverCard[] = [
    {
      id: "safari",
      title: "Safari Quest",
      desc: "Savanna Adventure",
      bg: "bg-[#E87154]", // Terracotta Coral
      border: "border-[#302824]",
      text: "text-white",
      rotate: "rotate-[-6deg] sm:rotate-[-12deg]",
      translateY: "translate-y-3 sm:translate-y-6",
      translateX: "-translate-x-1.5 sm:-translate-x-8",
      character: "green",
      greeting: "Akwaaba,",
      illustration: (
        <svg viewBox="0 0 40 40" className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 mx-auto my-1 xs:my-2 sm:my-3 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round">
          {/* Tree shape */}
          <path d="M20 30 L20 20 M12 20 Q20 16 28 20 Q35 15 28 10 Q20 14 12 10 Q5 15 12 20 Z" />
        </svg>
      )
    },
    {
      id: "ananse",
      title: "Ananse's Gold",
      desc: "Folk Tale Wisdom",
      bg: "bg-[#C2D5A8]", // Sage Green
      border: "border-[#302824]",
      text: "text-[#302824]",
      rotate: "rotate-[-3deg] sm:rotate-[-6deg]",
      translateY: "translate-y-1 sm:translate-y-1.5",
      translateX: "-translate-x-0.5 sm:-translate-x-2",
      character: "purple",
      greeting: "Awasse,",
      illustration: (
        <svg viewBox="0 0 40 40" className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 mx-auto my-1 xs:my-2 sm:my-3 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round">
          {/* Ashanti Stool representation */}
          <path d="M10 15 C15 12, 25 12, 30 15 M15 15 L18 28 M25 15 L22 28 M8 28 L32 28" />
        </svg>
      )
    },
    {
      id: "moonlight",
      title: "Moonlit Kingdom",
      desc: "Fantasy Lore",
      bg: "bg-[#D0C3E5]", // Clay Lavender
      border: "border-[#302824]",
      text: "text-[#302824]",
      rotate: "rotate-0",
      translateY: "translate-y-0",
      translateX: "translate-x-0",
      character: "orange",
      greeting: "Happy Birthday,",
      illustration: (
        <svg viewBox="0 0 40 40" className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 mx-auto my-1 xs:my-2 sm:my-3 fill-current">
          {/* Moon & star */}
          <path d="M12 12 A10 10 0 1 0 28 28 A12 12 0 1 1 12 12 Z" />
          <circle cx="28" cy="12" r="1.5" />
          <circle cx="32" cy="18" r="1" />
        </svg>
      )
    },
    {
      id: "drum",
      title: "Talking Drum",
      desc: "Music Quest",
      bg: "bg-[#B8D3E5]", // Dusty Sky Blue
      border: "border-[#302824]",
      text: "text-[#302824]",
      rotate: "rotate-[3deg] sm:rotate-[6deg]",
      translateY: "translate-y-1 sm:translate-y-1.5",
      translateX: "translate-x-0.5 sm:translate-x-2",
      character: "coral",
      greeting: "Let's read,",
      illustration: (
        <svg viewBox="0 0 40 40" className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 mx-auto my-1 xs:my-2 sm:my-3 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round">
          {/* Talking Drum */}
          <ellipse cx="20" cy="12" rx="8" ry="3" />
          <path d="M12 12 C12 20, 15 24, 15 28 M28 12 C28 20, 25 24, 25 28 M15 28 C15 30, 25 30, 25 28 M12 12 L28 12" />
        </svg>
      )
    },
    {
      id: "sun",
      title: "Dancing Sun",
      desc: "Festival Celebration",
      bg: "bg-[#F4C491]", // Sunset Gold
      border: "border-[#302824]",
      text: "text-[#302824]",
      rotate: "rotate-[6deg] sm:rotate-[12deg]",
      translateY: "translate-y-3 sm:translate-y-6",
      translateX: "translate-x-1.5 sm:translate-x-8",
      character: "purple",
      greeting: "Hello,",
      illustration: (
        <svg viewBox="0 0 40 40" className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 mx-auto my-1 xs:my-2 sm:my-3 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round">
          {/* Happy Sun */}
          <circle cx="20" cy="20" r="7" />
          <path d="M20 6 L20 10 M20 30 L20 34 M6 20 L10 20 M30 20 L34 20 M10 10 L13 13 M27 27 L30 30 M10 30 L13 27 M27 13 L30 10" />
        </svg>
      )
    }
  ];

  return (
    <section id="birthday-books" className="w-full py-20 bg-white border-b border-brand-coral/5 overflow-hidden">
      <div className="mx-auto max-w-7xl min-[1700px]:max-w-[100rem] px-6">
        
        {/* Centered Header */}
        <div className="max-w-3xl mx-auto text-center mb-10 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black text-[#302824] bg-[#D0C3E5] border-2 border-[#302824] shadow-sm">
            <Gift className="w-3.5 h-3.5" />
            Bespoke Keepsakes
          </span>
          <h2 className="text-3xl sm:text-4xl text-text-dark font-quicksand font-bold leading-tight">
            A Story Where Your Child Is The Hero
          </h2>
          <p className="text-base sm:text-lg text-text-muted leading-relaxed font-medium">
            Make their birthday unforgettable with a beautifully illustrated, personalized storybook. Enter your child's name below to see the magic.
          </p>
        </div>

        {/* Dynamic Name Input (Centered & Prominent) */}
        <div className="max-w-xs sm:max-w-sm mx-auto mb-20 p-1.5 bg-white border-2 border-[#302824] rounded-full shadow-soft flex items-center gap-2">
          <span className="pl-4 text-[10px] sm:text-xs font-black text-text-dark uppercase tracking-wider whitespace-nowrap">
            Child's Name:
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.substring(0, 15))}
            placeholder="Type a name..."
            className="flex-1 px-3 py-1.5 text-xs sm:text-sm font-bold text-text-dark focus:outline-none"
          />
        </div>

        {/* Fanned Cards Showcase (Pallet Ross layout) */}
        <div className="relative w-full flex items-center justify-center min-h-[360px] md:min-h-[400px] mb-20 px-4 md:px-12 select-none overflow-visible">
          <div className="flex items-end justify-center w-full max-w-4xl relative">
            
            {cards.map((card, idx) => {
              const displayName = name.trim() || "Ama";
              
              return (
                <div
                  key={card.id}
                  className={`group relative w-[72px] min-[375px]:w-[80px] xs:w-[100px] sm:w-[140px] md:w-[185px] aspect-[3/4] rounded-xl sm:rounded-2xl border-2 sm:border-[3px] border-[#302824] p-1.5 xs:p-2.5 sm:p-4 md:p-5 flex flex-col justify-between overflow-visible transition-all duration-300 shadow-md ${card.bg} ${card.text} ${card.rotate} ${card.translateY} ${card.translateX} hover:z-50 hover:scale-105 hover:translate-y-[-28px] hover:rotate-0 -mx-2.5 min-[375px]:-mx-3 sm:-mx-4 md:-mx-5`}
                  style={{ zIndex: idx + 1 }}
                >
                  {/* Spine shadow book-style effect */}
                  <div className="absolute inset-y-0 left-0 w-1.5 sm:w-3 bg-gradient-to-r from-black/10 to-transparent pointer-events-none rounded-l-xl" />
                  
                  {/* Edge gold leaf highlight */}
                  <div className="absolute top-0 bottom-0 right-0 w-[1px] sm:w-[2px] bg-yellow-400/30 rounded-r-xl" />
                  
                  {/* Top Publisher Text */}
                  <div className="text-center select-none relative z-10">
                    <span className="text-[5px] xs:text-[6px] sm:text-[7px] font-black uppercase tracking-widest opacity-80 leading-none block">
                      {card.desc}
                    </span>
                  </div>

                  {/* SVG Illustration Cover Graphic */}
                  <div className="relative z-10">
                    {card.illustration}
                  </div>

                  {/* Dynamic Title (displays visitor typed name) */}
                  <div className="text-center mt-auto pb-0.5 sm:pb-1 relative z-10">
                    <h4 className="font-quicksand font-bold leading-tight tracking-tight break-words px-0.5">
                      <span className="block text-[7px] xs:text-[9px] sm:text-xs font-semibold leading-none">{displayName}'s</span>
                      <span className="block text-[8px] xs:text-[10px] sm:text-sm font-black uppercase tracking-tight leading-none mt-0.5 sm:mt-1">
                        {card.title.split(" ")[1] || card.title}
                      </span>
                    </h4>
                  </div>

                  {/* Absolute Popup Character above card on hover */}
                  <div className="absolute -top-[108px] left-1/2 -translate-x-1/2 flex flex-col items-center opacity-0 group-hover:opacity-100 group-hover:-translate-y-3 transition-all duration-300 pointer-events-none z-50">
                    {/* Speech Bubble */}
                    <div className="bg-[#302824] text-white text-[9px] sm:text-[10px] font-black px-2.5 py-1.5 rounded-xl shadow-md whitespace-nowrap mb-2 relative border border-[#FAF5EF]/10">
                      {card.greeting} {displayName}!
                      {/* Speech Bubble Arrow */}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#302824] rotate-45" />
                    </div>
                    {/* Dynamic Character Blob component */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14">
                      {card.character === "green" && <GreenBlob className="w-full h-full drop-shadow-md" />}
                      {card.character === "purple" && <PurpleBlob className="w-full h-full drop-shadow-md" />}
                      {card.character === "orange" && <OrangeBlob className="w-full h-full drop-shadow-md" />}
                      {card.character === "coral" && <CoralBlob className="w-full h-full drop-shadow-md" />}
                    </div>
                  </div>

                </div>
              );
            })}

          </div>
        </div>

        {/* Bottom Details & CTA */}
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <p className="text-sm sm:text-base font-semibold text-text-muted leading-relaxed">
            Every book is customized with their name woven into the storyline, Ashanti-inspired values, and vibrant cultural illustrations. Available in digital formats or premium hardback printed copies.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 px-6">
            <a
              href="https://app.landoffairytales.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-bold text-white bg-brand-coral hover:bg-brand-coral/90 transition-all shadow-soft btn-springy"
            >
              <span>Order A Birthday Book</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 flex-shrink-0" />
            </a>
            <a
              href="#products"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-bold text-brand-coral bg-white border border-brand-coral/20 hover:bg-brand-coral/5 transition-all shadow-soft btn-springy"
            >
              Learn More
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
