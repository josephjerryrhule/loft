"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Award, BookOpen, GraduationCap, Globe, ShieldCheck, Bookmark } from "lucide-react";

const partners = [
  {
    name: "Ghana Education Service",
    icon: ShieldCheck,
    text: "GHANA ED SERVICE",
    iconColor: "group-hover:text-[#4CAF50]",
  },
  {
    name: "Accra Day School",
    icon: GraduationCap,
    text: "ACCRA DAY SCHOOL",
    iconColor: "group-hover:text-[#9C27B0]",
  },
  {
    name: "Ashesi Publishing",
    icon: BookOpen,
    text: "ASHESI PUBLISHING",
    iconColor: "group-hover:text-[#E87154]",
  },
  {
    name: "Kumasi Academy",
    icon: Award,
    text: "KUMASI ACADEMY",
    iconColor: "group-hover:text-[#FFB300]",
  },
  {
    name: "UNESCO Youth",
    icon: Globe,
    text: "UNESCO YOUTH",
    iconColor: "group-hover:text-[#03A9F4]",
  },
  {
    name: "Read Ghana Initiative",
    icon: Bookmark,
    text: "READ GHANA",
    iconColor: "group-hover:text-[#E91E63]",
  }
];

// Duplicate partners for seamless looping marquee
const marqueePartners = [...partners, ...partners, ...partners];

export default function Partners() {
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!trackRef.current) return;

    const ctx = gsap.context(() => {
      const track = trackRef.current;
      if (!track) return;

      const tween = gsap.to(track, {
        xPercent: -33.33, // Animate 1/3 of the track since we duplicated it 3 times to ensure zero gap
        ease: "none",
        duration: 25, // Scroll speed
        repeat: -1,
      });

      tweenRef.current = tween;
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

  return (
    <section className="w-full py-10 bg-brand-cream/20 border-b border-brand-coral/5 overflow-hidden">
      <div className="mx-auto max-w-[100rem]">
        {/* Small Intro label */}
        <p className="text-center text-[10px] uppercase font-black text-text-muted tracking-[0.2em] mb-6">
          Partnering with leading schools and organizations
        </p>

        {/* Looped Marquee */}
        <div
          className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Side shadows to blend */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#FAF5EF] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#FAF5EF] to-transparent z-10 pointer-events-none" />

          <div
            ref={trackRef}
            className="marquee-track flex gap-12 w-max items-center"
          >
            {marqueePartners.map((partner, idx) => {
              const Icon = partner.icon;
              return (
                <div
                  key={`${partner.name}-${idx}`}
                  className="group flex items-center gap-3 grayscale opacity-45 hover:grayscale-0 hover:opacity-100 transition-all duration-300 px-6 py-2 select-none"
                >
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#302824]/10 shadow-sm flex items-center justify-center transition-colors">
                    <Icon className={`w-5 h-5 transition-colors text-text-dark ${partner.iconColor}`} />
                  </div>
                  <span className="text-xs font-black tracking-widest text-[#302824] whitespace-nowrap font-quicksand">
                    {partner.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
