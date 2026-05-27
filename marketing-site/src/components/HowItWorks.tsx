"use client";

import React from "react";
import { UserPlus, Compass, Sparkles, Trophy, ArrowRight } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Create Your Account",
      description: "Set up your parent dashboard account in under two minutes to start managing your family profile.",
      icon: <UserPlus className="w-6 h-6 text-brand-coral" />,
      colorClass: "bg-brand-coral/10 border-brand-coral/25",
    },
    {
      number: "02",
      title: "Choose Your Experience",
      description: "Select reading plans, order personalized birthday books, download printable worksheets, or join as an ambassador.",
      icon: <Compass className="w-6 h-6 text-text-dark" />,
      colorClass: "bg-brand-green/20 border-brand-green/30",
    },
    {
      number: "03",
      title: "Personalize Your Journey",
      description: "Set up individual child profiles with their names and birth dates to dynamically customize reading tracks.",
      icon: <Sparkles className="w-6 h-6 text-text-dark" />,
      colorClass: "bg-brand-purple/20 border-brand-purple/30",
    },
    {
      number: "04",
      title: "Start Reading & Growing",
      description: "Open wiggling 3D flipbooks, track daily streaks, unlock achievement badges, and watch vocabulary and confidence soar.",
      icon: <Trophy className="w-6 h-6 text-text-dark" />,
      colorClass: "bg-brand-orange/20 border-brand-orange/30",
    },
  ];

  return (
    <section id="how-it-works" className="w-full py-20 bg-white border-b border-brand-coral/5">
      <div className="mx-auto max-w-7xl min-[1700px]:max-w-[100rem] px-6">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-brand-coral bg-brand-coral/5 border border-brand-coral/10">
            <Sparkles className="w-3.5 h-3.5" />
            Simple Steps
          </span>
          <h2 className="text-3xl sm:text-4xl text-text-dark font-quicksand font-bold">
            Getting Started Is Simple
          </h2>
          <p className="text-base sm:text-lg text-text-muted font-medium">
            Your family's reading adventure begins in a few easy steps.
          </p>
        </div>

        {/* Roadmap Flow */}
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 mb-16">
          {/* Connector Line (Desktop only) */}
          <div className="hidden md:block absolute top-[44px] left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-brand-coral/15 -z-10" />

          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center text-center space-y-4 relative">
              
              {/* Step Number Badge */}
              <span className="absolute -top-3 -right-1 md:right-auto md:left-[55%] text-[10px] font-black tracking-wider text-brand-coral bg-brand-coral/10 px-2 py-0.5 rounded-full shadow-sm">
                Step {step.number}
              </span>

              {/* Icon Container */}
              <div className={`w-16 h-16 rounded-full border flex items-center justify-center shadow-soft relative bg-white ${step.colorClass}`}>
                {step.icon}
              </div>

              {/* Text */}
              <div className="space-y-2">
                <h3 className="text-lg font-quicksand font-bold text-text-dark">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-text-muted leading-relaxed max-w-[240px] mx-auto">
                  {step.description}
                </p>
              </div>

            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="text-center">
          <a
            href="https://app.landoffairytales.com/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full text-base font-bold text-white bg-brand-coral hover:bg-brand-coral/90 transition shadow-soft shadow-card-hover"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5 ml-2" />
          </a>
        </div>

      </div>
    </section>
  );
}
