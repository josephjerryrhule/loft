"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Award, BookOpen, GraduationCap, Globe, ShieldCheck, Bookmark } from "lucide-react";

const partnerLogos = [
  { src: "/partner-1.png", alt: "Partner Logo 1" },
  { src: "/partner-2.jpg", alt: "Partner Logo 2" },
  { src: "/partner-3.png", alt: "Partner Logo 3" },
  { src: "/partner-4.png", alt: "Partner Logo 4" },
  { src: "/partner-5.png", alt: "Partner Logo 5" }
];

// Duplicate partners for seamless looping marquee
const marqueePartners = [...partnerLogos, ...partnerLogos, ...partnerLogos, ...partnerLogos];

export default function Partners() {
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!trackRef.current) return;

    const ctx = gsap.context(() => {
      const track = trackRef.current;
      if (!track) return;

      const tween = gsap.to(track, {
        xPercent: -50, // Animate 50% of the track since we duplicated it to ensure zero gap
        ease: "none",
        duration: 20, // Scroll speed
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
    <section id="partners" className="w-full py-8 bg-brand-purple border-b border-brand-coral/5 overflow-hidden">
      <div className="mx-auto max-w-[100rem]">
        {/* Small Intro label */}
        <p className="text-center text-[10px] uppercase font-black text-text-dark/75 tracking-[0.2em] mb-5">
          Partnering with leading schools and organizations
        </p>

        {/* Looped Marquee */}
        <div
          className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Side shadows to blend */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-brand-purple to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-brand-purple to-transparent z-10 pointer-events-none" />

          <div
            ref={trackRef}
            className="marquee-track flex gap-16 w-max items-center"
          >
            {marqueePartners.map((partner, idx) => {
              return (
                <div
                  key={`${partner.alt}-${idx}`}
                  className="group flex items-center justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300 select-none"
                >
                  <img
                    src={partner.src}
                    alt={partner.alt}
                    className="h-10 sm:h-12 w-auto object-contain max-w-[120px] sm:max-w-[150px]"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
