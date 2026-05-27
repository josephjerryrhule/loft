"use client";

import React from "react";
import { ArrowRight, LayoutDashboard, Sparkles } from "lucide-react";

export default function Gateway() {
  return (
    <section id="gateway" className="w-full py-20 bg-brand-cream/10 border-b border-brand-coral/5 bg-grid-pattern">
      <div className="mx-auto max-w-7xl min-[1700px]:max-w-[100rem] px-6">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-brand-coral bg-brand-coral/5 border border-brand-coral/10">
            <LayoutDashboard className="w-3.5 h-3.5" />
            Portal Login Gateway
          </span>
          <h2 className="text-3xl sm:text-4xl text-text-dark font-quicksand font-bold">
            Continue Your Journey
          </h2>
          <p className="text-base sm:text-lg text-text-muted font-medium">
            Select your destination below to access your account or start reading immediately.
          </p>
        </div>

        {/* Two Gateway Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Card 1: LOFT Platform (Parents/Ambassadors/Admins) */}
          <div className="flex flex-col justify-between p-8 rounded-3xl border border-brand-coral/10 bg-brand-purple bg-opacity-35 shadow-soft shadow-card-hover min-h-[260px]">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-brand-coral/15 text-brand-coral">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-quicksand font-bold text-text-dark">
                LOFT Parent & Promoter Portal
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-text-muted leading-relaxed">
                Access child profiles, monitor reading streaks, download customized printable kits, or check affiliate override commission metrics.
              </p>
            </div>

            <div className="pt-6">
              <a
                href="https://app.landoffairytales.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-full text-xs font-extrabold text-white bg-brand-coral hover:bg-brand-coral/90 transition shadow-sm"
              >
                Go To Portal
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </a>
            </div>
          </div>

          {/* Card 2: Children's Reading Portal (Children) */}
          <div className="flex flex-col justify-between p-8 rounded-3xl border border-brand-coral/10 bg-brand-green bg-opacity-35 shadow-soft shadow-card-hover min-h-[260px]">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-brand-coral/15 text-text-dark">
                <Sparkles className="w-6 h-6 text-brand-coral fill-brand-coral/10" />
              </div>
              <h3 className="text-xl font-quicksand font-bold text-text-dark">
                Children's Reading Portal
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-text-muted leading-relaxed">
                A safe, fun, and magical space for kids. Instantly open 3D books, increase reading streak flames, and explore unlockable badge shelves.
              </p>
            </div>

            <div className="pt-6">
              <a
                href="https://app.landoffairytales.com/child"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-full text-xs font-extrabold text-white bg-text-dark hover:bg-text-dark/95 transition shadow-sm"
              >
                Start Reading
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
