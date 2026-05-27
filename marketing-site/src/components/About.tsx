"use client";

import React, { useState, useRef, useCallback } from "react";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { GreenBlob, PurpleBlob, OrangeBlob } from "./CharacterBlobs";

export default function About() {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const pillars = [
    { label: "Culturally Meaningful", bg: "bg-brand-green", border: "border-brand-green" },
    { label: "Confidence Building", bg: "bg-brand-purple", border: "border-brand-purple" },
    { label: "Interactive & Exciting", bg: "bg-brand-blue", border: "border-brand-blue" },
  ];

  const libraryTiers = [
    {
      key: "little",
      title: "Little Lofters",
      age: "Ages 0 – 3",
      tagline: "Sensory reading, shapes, and cozy tales for toddlers",
      badgeBg: "bg-brand-green",
      checkBg: "bg-brand-green/40",
      blob: <GreenBlob className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 drop-shadow-sm" />,
      bullets: [
        "Sensory board books, shape & color recognition",
        "Cozy stories designed for parent read-along sessions",
        "Soft layouts, large typography, and friendly characters",
        "Perfect for early visual and sound milestones"
      ],
    },
    {
      key: "loft365",
      title: "LOFT 365",
      age: "Ages 4 – 7",
      tagline: "Energetic vocabulary builders and gamified habit loops",
      badgeBg: "bg-brand-purple",
      checkBg: "bg-brand-purple/40",
      blob: <PurpleBlob className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 drop-shadow-sm" />,
      bullets: [
        "Interactive adventure books, phonics, and letter sounds",
        "Daily reading streak counter to build habit loops",
        "Unlockable badge shelves — Bookworm, 7-Day Streak",
        "Friendly explorer characters to guide the journey"
      ],
    },
    {
      key: "big",
      title: "Big Readers",
      age: "Ages 8+",
      tagline: "Chapter books and independent learning quests",
      badgeBg: "bg-brand-orange",
      checkBg: "bg-brand-orange/40",
      blob: <OrangeBlob className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 drop-shadow-sm" />,
      bullets: [
        "Chapter books, fantasy, adventure, history, and science",
        "Comprehension quizzes and critical thinking exercises",
        "Ancient maps, achievement trophies, deeper styling",
        "Supports independent discovery and vocabulary growth"
      ],
    },
  ];

  // Carousel helpers
  const goToSlide = useCallback((index: number) => {
    setCarouselIndex(Math.max(0, Math.min(index, libraryTiers.length - 1)));
  }, [libraryTiers.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && carouselIndex < libraryTiers.length - 1) goToSlide(carouselIndex + 1);
      else if (diff < 0 && carouselIndex > 0) goToSlide(carouselIndex - 1);
    }
  };

  // Shared card renderer
  const renderTierCard = (tier: typeof libraryTiers[0]) => (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#302824]/[0.06]">
      {/* Top row: blob + title block */}
      <div className="flex items-center gap-5 mb-5">
        <div className="flex-shrink-0">{tier.blob}</div>
        <div className="space-y-1.5">
          <span
            className={`inline-block text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full text-[#302824] ${tier.badgeBg}`}
          >
            {tier.age}
          </span>
          <h4 className="text-lg sm:text-xl font-quicksand font-bold text-text-dark leading-tight">
            {tier.title}
          </h4>
          <p className="text-xs sm:text-[13px] text-text-muted leading-relaxed">
            {tier.tagline}
          </p>
        </div>
      </div>

      {/* Bullet list */}
      <ul className="space-y-2.5 border-t border-[#302824]/[0.05] pt-4">
        {tier.bullets.map((bullet, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px] text-text-dark/85 leading-snug">
            <span
              className={`mt-[3px] w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 ${tier.checkBg}`}
            >
              <Check className="w-2.5 h-2.5 stroke-[2.5] text-[#302824]" />
            </span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section id="about" className="w-full py-16 sm:py-20 lg:py-28 bg-white border-b border-brand-coral/5">
      <div className="mx-auto max-w-7xl min-[1700px]:max-w-[100rem] px-5 sm:px-6">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">

          {/* ─── Left Column: Sticky context ─── */}
          <div className="lg:col-span-5 lg:sticky lg:top-[110px] lg:self-start lg:h-fit space-y-5">

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black text-[#302824] bg-brand-purple border-2 border-[#302824] shadow-sm">
              What is LOFT?
            </div>

            {/* Heading */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl text-text-dark font-quicksand font-bold leading-[1.2]">
              More than reading —<br className="hidden sm:block" /> a world of confidence, culture & imagination.
            </h2>

            {/* Body copy */}
            <p className="text-sm sm:text-[15px] lg:text-base text-text-muted leading-relaxed max-w-xl">
              LOFT is an interactive reading platform that helps children fall in love with stories. We combine 3D flipbooks, personalized quests, and culturally relevant tales to turn screen time into meaningful milestones.
            </p>

            {/* Pillars — clean inline tags using brand colors */}
            <div className="flex flex-wrap gap-2 pt-1">
              {pillars.map((p, i) => (
                <span
                  key={i}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-full text-[#302824] ${p.bg}`}
                >
                  {p.label}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="pt-3">
              <a
                href="#products"
                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full text-sm font-bold text-white bg-brand-coral hover:bg-brand-coral/90 transition-colors shadow-sm btn-springy"
              >
                Explore Experiences
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              </a>
            </div>
          </div>

          {/* ─── Right Column (Desktop): Stacking Cards ─── */}
          <div className="hidden lg:block lg:col-span-7">
            <div className="space-y-8">
              {libraryTiers.map((tier, index) => (
                <div
                  key={tier.key}
                  className="lg:sticky will-change-transform"
                  style={{
                    top: `${120 + index * 36}px`,
                    zIndex: (index + 1) * 10,
                  }}
                >
                  {renderTierCard(tier)}
                </div>
              ))}
            </div>
          </div>

          {/* ─── Right Column (Mobile): Swipeable Carousel ─── */}
          <div className="lg:hidden col-span-1">
            <div
              className="relative overflow-hidden rounded-2xl"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
              >
                {libraryTiers.map((tier) => (
                  <div key={tier.key} className="w-full flex-shrink-0 px-0.5">
                    {renderTierCard(tier)}
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-4 mt-5">
              <button
                onClick={() => carouselIndex > 0 && goToSlide(carouselIndex - 1)}
                className={`w-8 h-8 rounded-full border border-[#302824]/10 flex items-center justify-center transition-opacity active:scale-95 ${
                  carouselIndex === 0 ? "opacity-25 cursor-not-allowed" : "cursor-pointer"
                }`}
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4 text-text-dark" />
              </button>

              <div className="flex items-center gap-2">
                {libraryTiers.map((tier, index) => (
                  <button
                    key={tier.key}
                    onClick={() => goToSlide(index)}
                    className={`rounded-full transition-all duration-300 cursor-pointer ${
                      carouselIndex === index
                        ? "w-6 h-2 bg-brand-coral"
                        : "w-2 h-2 bg-[#302824]/12 hover:bg-[#302824]/20"
                    }`}
                    aria-label={`Go to ${tier.title}`}
                  />
                ))}
              </div>

              <button
                onClick={() => carouselIndex < libraryTiers.length - 1 && goToSlide(carouselIndex + 1)}
                className={`w-8 h-8 rounded-full border border-[#302824]/10 flex items-center justify-center transition-opacity active:scale-95 ${
                  carouselIndex === libraryTiers.length - 1 ? "opacity-25 cursor-not-allowed" : "cursor-pointer"
                }`}
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4 text-text-dark" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
