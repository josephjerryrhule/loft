"use client";

import React from "react";
import { Check, ArrowRight } from "lucide-react";
import { GreenBlob, PurpleBlob, OrangeBlob, CoralBlob } from "./CharacterBlobs";

export default function Hero() {
  const trustIndicators = [
    "Child-friendly learning",
    "Confidence-building stories",
    "Interactive reading experiences",
    "Personalized books & tools",
  ];

  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden bg-brand-purple bg-grid-pattern pt-16 pb-20 md:pt-24 md:pb-28 border-b border-brand-coral/5"
    >
      {/* Background radial gradient mask for softening the grid lines */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-brand-purple/40 to-brand-purple pointer-events-none" />

      <div className="relative mx-auto max-w-7xl min-[1700px]:max-w-[100rem] px-6 flex flex-col items-center text-center">
        {/* Cute top badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black text-[#302824] bg-[#FFD02B] border-2 border-[#302824] mb-6 md:mb-8 shadow-sm animate-bounce">
          Welcome to a new world of reading
        </div>

        {/* Main Headline */}
        <h1 className="max-w-4xl text-4xl sm:text-5xl md:text-6xl text-text-dark tracking-tight leading-[1.1] mb-6 font-quicksand font-bold">
          Build Confidence Through Stories That{" "}
          <span className="text-brand-coral relative inline-block">
            Feel Like Home
          </span>
        </h1>

        {/* Subheadline */}
        <p className="max-w-3xl text-base sm:text-lg text-text-dark/85 leading-relaxed mb-8 md:mb-10 font-medium">
          Interactive reading adventures children love, rooted in culture,
          imagination, and confidence-building. From magical storybooks and
          personalized birthday stories to habit-forming reading experiences,
          LOFT helps children grow while parents feel confident about every
          minute spent learning.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-[85%] sm:w-auto mb-10 md:mb-12">
          <a
            href="https://app.landoffairytales.com/auth/register"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-bold text-white bg-brand-coral hover:bg-brand-coral/90 transition-all shadow-soft btn-springy"
          >
            <span>Start Your Journey</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 flex-shrink-0" />
          </a>
          <a
            href="#about"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-bold text-brand-coral bg-white border border-brand-coral/20 hover:bg-brand-coral/5 transition-all shadow-soft btn-springy"
          >
            Explore LOFT
          </a>
        </div>

        {/* Trust Indicators Checkmarks */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 max-w-6xl w-full border-t border-brand-coral/10 pt-8 pb-12 mb-4">
          {trustIndicators.map((indicator, index) => (
            <div
              key={index}
              className="flex items-center gap-2 justify-center"
            >
              <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-brand-green border border-brand-coral/15 text-text-dark">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-text-dark/95 text-left whitespace-nowrap">
                {indicator}
              </span>
            </div>
          ))}
        </div>

        {/* Floating Brand Character Blobs Illustration Panel */}
        <div className="w-full max-w-5xl mt-8 flex flex-wrap items-center justify-center gap-8 md:gap-16 select-none">
          <div className="flex flex-col items-center">
            <GreenBlob className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 drop-shadow-md" />
            <span className="text-xs font-bold text-text-dark/75 mt-2">Ages 0 - 3</span>
          </div>
          <div className="flex flex-col items-center">
            <PurpleBlob className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 drop-shadow-md" />
            <span className="text-xs font-bold text-text-dark/75 mt-2">Ages 4 - 7</span>
          </div>
          <div className="flex flex-col items-center">
            <OrangeBlob className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 drop-shadow-md" />
            <span className="text-xs font-bold text-text-dark/75 mt-2">Ages 8+</span>
          </div>
          <div className="flex flex-col items-center">
            <CoralBlob className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 drop-shadow-md" />
            <span className="text-xs font-bold text-text-dark/75 mt-2">Magical Books</span>
          </div>
        </div>
      </div>
    </section>
  );
}
