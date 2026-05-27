"use client";

import React, { useState } from "react";
import { BookOpen, Sparkles, Heart, ChevronRight, Globe, Check } from "lucide-react";
import { GreenBlob, PurpleBlob, OrangeBlob } from "./CharacterBlobs";

export default function About() {
  const [activeTab, setActiveTab] = useState<"little" | "loft365" | "big">("loft365");

  const pillars = [
    {
      icon: Globe,
      title: "Culturally Meaningful",
      description: "Stories inspired by our heritage, names, values, and places so kids see themselves reflected in what they read.",
      iconColor: "text-[#4CAF50]",
      bgColor: "bg-[#F3F7F2]"
    },
    {
      icon: Sparkles,
      title: "Confidence Building",
      description: "Gamified streak counters, achievement badges, and rewards designed to transform reading into a daily habit.",
      iconColor: "text-[#9C27B0]",
      bgColor: "bg-[#F6F3F9]"
    },
    {
      icon: BookOpen,
      title: "Interactive & Exciting",
      description: "Wiggling 3D flipbook reading environments that keep children engaged, curious, and asking to read more.",
      iconColor: "text-[#03A9F4]",
      bgColor: "bg-[#F2F6F8]"
    }
  ];

  const libraryTiers = {
    little: {
      title: "Little Lofters",
      age: "Ages 0 - 3",
      tagline: "Sensory reading, shapes, and cozy tales for toddlers",
      bgColor: "bg-brand-green/10",
      borderColor: "border-brand-green/30",
      badgeColor: "text-[#4CAF50] bg-[#4CAF50]/10 border-[#4CAF50]/20",
      blob: <GreenBlob className="w-40 h-40 drop-shadow-md hover:scale-105 transition-transform" />,
      bullets: [
        "Sensory board books, shape & color recognition",
        "Cozy stories designed for parent read-along sessions",
        "Soft layouts, large typography, and friendly animal characters",
        "Perfect for early visual and sound milestones"
      ],
    },
    loft365: {
      title: "LOFT 365",
      age: "Ages 4 - 7",
      tagline: "Energetic vocabulary builders and gamified habit loops",
      bgColor: "bg-brand-purple/10",
      borderColor: "border-brand-purple/30",
      badgeColor: "text-[#9C27B0] bg-[#9C27B0]/10 border-[#9C27B0]/20",
      blob: <PurpleBlob className="w-40 h-40 drop-shadow-md hover:scale-105 transition-transform" />,
      bullets: [
        "Interactive adventure books, basic phonics, and letter sounds",
        "Daily reading streak counter to encourage habit loops",
        "Unlockable virtual badge shelves (Bookworm, 7-Day Streak)",
        "Friendly explorer characters to guide learning journeys"
      ],
    },
    big: {
      title: "Big Readers",
      age: "Ages 8 and Up",
      tagline: "Chapter books and independent learning quests",
      bgColor: "bg-brand-orange/10",
      borderColor: "border-brand-orange/30",
      badgeColor: "text-[#FFB300] bg-[#FFB300]/10 border-[#FFB300]/20",
      blob: <OrangeBlob className="w-40 h-40 drop-shadow-md hover:scale-105 transition-transform" />,
      bullets: [
        "Chapter books, fantasy/adventure lore, history, and science",
        "Comprehension quizzes and critical thinking exercises",
        "Deeper visual styling, ancient maps, and achievement trophies",
        "Supports independent discovery and vocabulary expansion"
      ],
    },
  };

  const activeTier = libraryTiers[activeTab];

  return (
    <section id="about" className="w-full py-20 bg-white border-b border-brand-coral/5">
      <div className="mx-auto max-w-7xl min-[1700px]:max-w-[100rem] px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Context & Pillars */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black text-[#302824] bg-[#D0C3E5] border-2 border-[#302824] shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              What is LOFT?
            </div>
            
            <h2 className="text-3xl sm:text-4xl text-text-dark font-quicksand font-bold leading-tight">
              More Than Reading. A World Of Confidence, Culture & Imagination.
            </h2>
            
            <p className="text-base sm:text-lg text-text-muted leading-relaxed font-medium">
              LOFT is an interactive reading platform designed to help children fall in love with reading. By combining interactive 3D books, personalized quests, and culturally relevant stories, we transform screen time into visual milestones.
            </p>

            {/* Core Value Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {pillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <div 
                    key={idx} 
                    className={`p-5 rounded-2xl border border-[#302824]/5 ${pillar.bgColor} shadow-soft flex flex-col justify-between space-y-3 transition-transform hover:-translate-y-1 duration-300`}
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#302824]/10 flex items-center justify-center">
                        <Icon className={`w-5 h-5 ${pillar.iconColor}`} />
                      </div>
                      <h4 className="text-sm font-bold text-text-dark font-quicksand">
                        {pillar.title}
                      </h4>
                      <p className="text-xs text-text-muted leading-relaxed font-medium">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Explore link */}
            <div className="pt-4 flex items-center gap-2">
              <a
                href="#products"
                className="inline-flex items-center justify-center px-6 sm:px-7 py-3 sm:py-3.5 rounded-full text-xs sm:text-sm font-bold text-white bg-brand-coral hover:bg-brand-coral/90 transition-all shadow-soft btn-springy"
              >
                <span>Explore Experiences</span>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 flex-shrink-0" />
              </a>
            </div>
          </div>

          {/* Right Column: Interactive Library Tabs Switcher */}
          <div className="lg:col-span-5 flex flex-col card-organic p-6 bg-brand-cream/40 shadow-soft">
            <h3 className="text-center font-quicksand font-bold text-text-dark mb-4 text-base tracking-wide">
              Explore Our Reading Libraries
            </h3>

            {/* Selector Grid */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-brand-cream/80 border border-brand-coral/10 rounded-2xl mb-6">
              {(Object.keys(libraryTiers) as Array<keyof typeof libraryTiers>).map((tierKey) => (
                <button
                  key={tierKey}
                  onClick={() => setActiveTab(tierKey)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === tierKey
                      ? "bg-white text-brand-coral shadow-sm border border-brand-coral/10"
                      : "text-text-muted hover:text-text-dark"
                  }`}
                >
                  {libraryTiers[tierKey].title}
                </button>
              ))}
            </div>

            {/* Active Card Preview */}
            <div className={`flex flex-col items-center p-6 rounded-2xl border-2 ${activeTier.borderColor} ${activeTier.bgColor} transition-all duration-300 shadow-sm`}>
              <div className="mb-4 h-40 flex items-center justify-center select-none transform hover:scale-105 transition-transform duration-500">
                {activeTier.blob}
              </div>
              
              <div className="text-center space-y-2 mb-6">
                <span className={`inline-block text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border ${activeTier.badgeColor}`}>
                  {activeTier.age}
                </span>
                <h4 className="text-xl font-quicksand font-bold text-text-dark leading-none">
                  {activeTier.title}
                </h4>
                <p className="text-xs font-semibold text-text-muted px-4 leading-normal">
                  {activeTier.tagline}
                </p>
              </div>

              {/* Bullet Features */}
              <ul className="w-full space-y-2.5 text-left border-t border-[#302824]/5 pt-4">
                {activeTier.bullets.map((bullet, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-xs font-semibold text-text-dark/95 leading-snug">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-white border border-[#302824]/10 flex items-center justify-center text-brand-coral flex-shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
