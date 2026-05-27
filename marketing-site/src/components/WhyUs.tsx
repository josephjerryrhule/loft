"use client";

import React, { useEffect, useRef } from "react";
import { Tv, Sparkles, Heart, BarChart, UserCheck, Flame, ArrowRight } from "lucide-react";
import { gsap } from "gsap";

const cards = [
  {
    id: 1,
    icon: Tv,
    title: "Turn Screen Time Into Story Time",
    description: "Children experience reading in a way that feels magical and exciting. By replacing passive scrolling with immersive learning, we transform digital habits into positive milestones.",
    bgColor: "bg-brand-orange",
    iconColor: "text-brand-coral",
    footerText: "Go beyond passive screen time"
  },
  {
    id: 2,
    icon: Heart,
    title: "Stories Children Relate To",
    description: "Children engage with stories inspired by culture, values, and communities that feel closer to home. Representing their identity builds deep connection and reading joy.",
    bgColor: "bg-brand-green",
    iconColor: "text-brand-coral",
    footerText: "Ghanaian & African heritage"
  },
  {
    id: 3,
    icon: Sparkles,
    title: "Build Confidence Through Reading",
    description: "LOFT helps nurture confidence, vocabulary, curiosity, creativity, and stronger reading habits through joyful, child-guided digital experiences.",
    bgColor: "bg-brand-purple",
    iconColor: "text-brand-coral",
    footerText: "Confidence & vocabulary"
  },
  {
    id: 4,
    icon: UserCheck,
    title: "Personalized Learning",
    description: "From personalized birthday storybooks to tailored child profiles and age-based reading journeys, LOFT feels custom-fit to every child's growth track.",
    bgColor: "bg-brand-blue",
    iconColor: "text-brand-coral",
    footerText: "Adaptive reading maps"
  },
  {
    id: 5,
    icon: BarChart,
    title: "Parent-Friendly Experience",
    description: "Parents can support reading through simple control dashboards, detailed progress tracking charts, separate profiles, and age-appropriate content recommendations.",
    bgColor: "bg-brand-orange/40",
    iconColor: "text-brand-coral",
    footerText: "Real-time parent analytics"
  },
  {
    id: 6,
    icon: Flame,
    title: "Reading Children Actually Enjoy",
    description: "No boring exercises. LOFT is fully built around gamified challenges, reading achievements, wiggling story book flipboards, and badges to make children ask to read every day.",
    bgColor: "bg-brand-purple/50",
    iconColor: "text-brand-coral",
    footerText: "Gamified reading streaks"
  }
];

// Duplicate cards once to ensure a seamless looping marquee
const marqueeCards = [...cards, ...cards];

export default function WhyUs() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!trackRef.current) return;

    // Use GSAP context for automatic cleanup
    const ctx = gsap.context(() => {
      const track = trackRef.current;
      if (!track) return;

      // Continuous infinite horizontal translation
      const tween = gsap.to(track, {
        xPercent: -50,
        ease: "none",
        duration: 35, // Adjust duration for scrolling speed
        repeat: -1,
      });

      tweenRef.current = tween;
    });

    return () => ctx.revert();
  }, []);

  const handleMouseEnter = () => {
    if (tweenRef.current) {
      // Smooth deceleration to stop
      gsap.to(tweenRef.current, { timeScale: 0, duration: 0.5, ease: "power1.out" });
    }
  };

  const handleMouseLeave = () => {
    if (tweenRef.current) {
      // Smooth acceleration to resume
      gsap.to(tweenRef.current, { timeScale: 1, duration: 0.5, ease: "power1.out" });
    }
  };

  return (
    <section id="why-us" ref={containerRef} className="w-full py-20 bg-brand-cream/30 border-b border-brand-coral/5 overflow-hidden">
      <div className="mx-auto max-w-[100rem]">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4 px-6">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black text-[#302824] bg-brand-coral border-2 border-[#302824] shadow-sm">
            <Heart className="w-3.5 h-3.5" />
            Loved By Families
          </div>
          <h2 className="text-3xl sm:text-4xl text-text-dark font-quicksand font-bold">
            Why Families Love LOFT
          </h2>
          <p className="text-base sm:text-lg text-text-muted font-medium">
            Built for children to love. Designed for parents to trust.
          </p>
        </div>

        {/* Continuous Looped Carousel */}
        <div 
          className="relative w-full overflow-hidden py-4 cursor-grab active:cursor-grabbing"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Premium side-fade overlays to blend the cards seamlessly at screen boundaries */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#FAF5EF] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#FAF5EF] to-transparent z-10 pointer-events-none" />
          
          <div 
            ref={trackRef}
            className="marquee-track flex gap-6 w-max"
          >
            {marqueeCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={`${card.id}-${idx}`}
                  className={`flex-shrink-0 w-[285px] sm:w-[400px] h-[340px] sm:h-[300px] p-6 sm:p-8 flex flex-col justify-between border-2 border-[#302824] ${card.bgColor} rounded-3xl shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg`}
                >
                  <div className="space-y-3 sm:space-y-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white border-2 border-[#302824] flex items-center justify-center">
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${card.iconColor}`} />
                    </div>
                    <h3 className="text-base sm:text-xl font-quicksand font-bold text-text-dark leading-tight">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-text-muted leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-text-dark/80 mt-2 sm:mt-4 pt-3 sm:pt-4 border-t border-[#302824]/10">
                    <Sparkles className="w-3.5 h-3.5 text-brand-coral" />
                    <span>{card.footerText}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="text-center mt-16 px-6">
          <a
            href="https://app.landoffairytales.com/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-bold text-white bg-brand-coral hover:bg-brand-coral/90 transition-all shadow-soft btn-springy text-center"
          >
            <span className="inline-block text-center">
              Help Your Child Fall In Love With Reading
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 inline-block align-middle ml-2 flex-shrink-0" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
