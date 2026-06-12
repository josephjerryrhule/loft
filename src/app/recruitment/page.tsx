"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Users,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Search,
  Loader2,
  AlertCircle,
  DollarSign,
  Star,
  Mic,
  Heart,
  MessageCircle,
  Lightbulb,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { lookupApplicationStatus } from "@/app/actions/recruitment";

// Custom minimalist SVG animations matching the brand aesthetic
const StorytellingIllustration = () => (
  <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-w-[240px]">
    <style>{`
      @keyframes leaf-wave { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(4deg); } }
      .anim-leaf { animation: leaf-wave 4s ease-in-out infinite; transform-origin: 100px 100px; }
      @keyframes float-flower { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-4px); } }
      .anim-flower { animation: float-flower 3s ease-in-out infinite; }
    `}</style>
    <path d="M40 140 C 30 90, 80 60, 120 90 C 160 120, 110 160, 40 140 Z" fill="#EAE2F8" />
    <path d="M120 50 C 150 30, 190 70, 170 110 C 150 150, 90 110, 120 50 Z" fill="#FFDCD3" />
    <rect x="50" y="90" width="100" height="50" rx="4" stroke="#1E293B" strokeWidth="1.5" fill="white" />
    <path d="M50 105 L 150 105" stroke="#1E293B" strokeWidth="1.5" />
    <circle cx="62" cy="97.5" r="2" fill="#1E293B" />
    <circle cx="70" cy="97.5" r="2" fill="#1E293B" />
    <circle cx="78" cy="97.5" r="2" fill="#1E293B" />
    <g className="anim-leaf">
      <path d="M100 140 Q 110 80 140 60" stroke="#1E293B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M110 120 C 130 110 140 130 120 140 C 100 150 90 130 110 120 Z" stroke="#1E293B" strokeWidth="1.5" fill="white" />
      <g className="anim-flower">
        <path d="M140 60 C 130 40 160 30 170 50 C 180 70 150 80 140 60 Z" stroke="#1E293B" strokeWidth="1.5" fill="white" />
        <circle cx="155" cy="55" r="4" fill="#E87154" />
      </g>
    </g>
    <path d="M170 110 Q 180 100 190 115" stroke="#FFEAA5" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

const EngagementIllustration = () => (
  <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-w-[240px]">
    <style>{`
      @keyframes float-eye { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-3px); } }
      .anim-eye { animation: float-eye 3s ease-in-out infinite; }
      @keyframes scan { 0%, 100% { transform: translateX(0px); } 50% { transform: translateX(8px); } }
      .anim-scan { animation: scan 4s ease-in-out infinite; }
    `}</style>
    <circle cx="90" cy="90" r="35" fill="#EAE2F8" />
    <path d="M150 70 L 190 70 L 170 110 Z" fill="#FFDCD3" />
    <circle cx="160" cy="140" r="20" fill="#FFEAA5" />
    <path d="M50 140 C 50 90, 110 90, 110 140" stroke="#1E293B" strokeWidth="1.5" fill="white" />
    <path d="M110 115 C 125 115, 125 140, 110 140" stroke="#1E293B" strokeWidth="1.5" fill="white" />
    <path d="M95 110 Q 105 115 95 125" stroke="#1E293B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <g className="anim-eye">
      <circle cx="80" cy="115" r="3" fill="#1E293B" />
      <path d="M72 105 Q 80 100 88 105" stroke="#1E293B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
    <g className="anim-scan">
      <circle cx="160" cy="80" r="24" stroke="#1E293B" strokeWidth="1.5" fill="white" />
      <path d="M143 97 L 120 120" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="160" cy="80" r="6" stroke="#1E293B" strokeWidth="1.5" fill="none" />
      <path d="M170 70 Q 175 80 165 90" stroke="#E87154" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  </svg>
);

const ImprovisationIllustration = () => (
  <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-w-[240px]">
    <style>{`
      @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      .anim-spin { animation: spin-slow 12s linear infinite; transform-origin: 150px 90px; }
      @keyframes float-block { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-6px) rotate(5deg); } }
      .anim-block { animation: float-block 3s ease-in-out infinite; }
      @keyframes pop-line { 0%, 100% { stroke-dashoffset: 0; } 50% { stroke-dashoffset: 10; } }
      .anim-line { animation: pop-line 2s linear infinite; stroke-dasharray: 4 4; }
    `}</style>
    <rect x="70" y="60" width="45" height="45" rx="8" fill="#FFEAA5" transform="rotate(15 92 82)" />
    <circle cx="160" cy="110" r="35" fill="#EAE2F8" />
    <path d="M90 140 L 120 120 L 150 150 Z" fill="#FFDCD3" />
    <rect x="50" y="80" width="40" height="40" rx="4" stroke="#1E293B" strokeWidth="1.5" fill="white" className="anim-block" />
    <circle cx="70" cy="100" r="6" fill="#1E293B" className="anim-block" />
    <g className="anim-spin">
      <path d="M150 50 L 160 80 L 190 90 L 160 100 L 150 130 L 140 100 L 110 90 L 140 80 Z" stroke="#1E293B" strokeWidth="1.5" fill="white" strokeLinejoin="round" />
    </g>
    <path d="M110 140 Q 130 110 180 140" stroke="#1E293B" strokeWidth="1.5" fill="none" className="anim-line" />
    <circle cx="180" cy="140" r="3" fill="#1E293B" />
  </svg>
);

// Hand-drawn squiggle SVGs to give that non-AI whimsical feel
const SquiggleLeft = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -left-12 -top-6 text-[#E87154] hidden md:block">
    <path d="M12.5 5.5C18 9 20 18 17 24C14.5 29 9 30 7 35M28 8.5C31 15 30 23 25 28C21 32 15 32 14 37" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M5 14L10 12L8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SquiggleRight = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -right-16 top-2 text-[#E87154] hidden md:block">
    <path d="M10 5C15 6 22 8 25 15C28 22 25 30 20 35C15 40 10 38 8 32C6 26 10 20 18 18C26 16 33 20 36 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export default function RecruitmentPage() {
  return (
    <div className="min-h-screen pb-20">
      
      {/* Hero Section */}
      <section className="relative w-full -mt-28 pt-40 sm:pt-48 pb-32 px-4 sm:px-6 lg:px-8 flex flex-col items-center bg-[#4B2E83] rounded-b-[3rem] shadow-xl overflow-hidden">
        
        {/* Happy Facilitators Pill */}
        <div className="relative flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full py-1.5 pl-2 pr-4 mb-8 shadow-sm">
          <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full border-2 border-white bg-blue-100 overflow-hidden"><img src="https://i.pravatar.cc/100?img=1" alt="Avatar" className="w-full h-full object-cover" /></div>
            <div className="w-6 h-6 rounded-full border-2 border-white bg-pink-100 overflow-hidden"><img src="https://i.pravatar.cc/100?img=5" alt="Avatar" className="w-full h-full object-cover" /></div>
            <div className="w-6 h-6 rounded-full border-2 border-[#4B2E83] bg-orange-100 overflow-hidden"><img src="https://i.pravatar.cc/100?img=12" alt="Avatar" className="w-full h-full object-cover" /></div>
            <div className="w-6 h-6 rounded-full border-2 border-[#4B2E83] bg-[#E87154] flex items-center justify-center text-[10px] text-white font-bold">↗</div>
          </div>
          <span className="text-xs font-bold text-white">Over 50+ happy facilitators</span>
        </div>

        {/* Title & Copy */}
        <div className="text-center space-y-6 relative max-w-3xl z-10">
          <SquiggleLeft />
          <SquiggleRight />
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-[-0.03em] leading-[1.05] font-['var(--font-quicksand)',_sans-serif]">
            Inspire a love for reading <br />
            with our <span className="relative">clubs
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-[#E87154] opacity-90" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 15Q25 5 50 15T100 15" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>
            </span>
          </h1>
          <p className="text-base sm:text-lg text-purple-100 font-medium max-w-xl mx-auto leading-relaxed pt-2">
            Help children fall in love with reading through fun, interactive sessions. Join our team of passionate facilitators making a lifelong difference.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 pb-12 w-full max-w-md mx-auto sm:max-w-none">
            <Link href="/recruitment/apply" className="w-full sm:w-auto">
              <Button className="w-full sm:w-48 bg-[#E87154] hover:bg-[#D66144] text-white font-bold h-14 rounded-full shadow-lg shadow-[#E87154]/20 transition-transform hover:scale-105 active:scale-95 text-base border border-[#E87154]">
                Apply Now
              </Button>
            </Link>
            <a href="#skills" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-48 bg-white/10 hover:bg-white/20 text-white font-bold h-14 rounded-full backdrop-blur-sm border-white/20 text-base">
                Learn More
              </Button>
            </a>
          </div>
        </div>

        {/* Cards Illustration */}
        <div className="relative w-full max-w-4xl h-[360px] mt-4 flex justify-center items-end px-4 z-10 translate-y-16">
          
          {/* Card 1 (Left) */}
          <div className="absolute left-[5%] md:left-[15%] bottom-0 w-48 sm:w-64 h-80 bg-blue-400 rounded-t-3xl border-4 border-slate-900/10 rotate-[-12deg] translate-y-8 origin-bottom-left shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-[#3eb1e5]">
              <Image src="https://cdnc.heyzine.com/files/uploaded/v3/668885c554797a60f153a02ca4a7237de3913d32.pdf-thumb.jpg" alt="Book Cover 5" fill className="object-cover opacity-90 mix-blend-overlay group-hover:scale-105 transition-transform duration-500" />
            </div>
          </div>

          {/* Card 3 (Right) */}
          <div className="absolute right-[5%] md:right-[15%] bottom-0 w-48 sm:w-64 h-80 bg-orange-400 rounded-t-3xl border-4 border-slate-900/10 rotate-[12deg] translate-y-8 origin-bottom-right shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-[#ff8c42]">
              <Image src="https://cdnc.heyzine.com/files/uploaded/v3/cc023a2abd4fa452666651c8ef6342eb10729d30.pdf-thumb.jpg" alt="Book Cover 3" fill className="object-cover opacity-90 mix-blend-overlay group-hover:scale-105 transition-transform duration-500" />
            </div>
          </div>

          {/* Card 2 (Center - Front) */}
          <div className="absolute z-10 bottom-0 w-56 sm:w-72 h-96 bg-[#E87154] rounded-t-3xl border-4 border-slate-900/10 shadow-2xl overflow-hidden group hover:-translate-y-4 transition-transform duration-300">
            <div className="absolute inset-0 bg-[#E87154] flex items-center justify-center">
              <Image src="https://cdnc.heyzine.com/files/uploaded/v3/3d39011a61551d6e74673adde691cf30ec89c82d.pdf-thumb.jpg" alt="Book Cover 4" fill className="object-cover opacity-90 mix-blend-overlay" />
            </div>
            {/* Playful elements inside the front card */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur px-6 py-2 rounded-full shadow-lg font-black text-[#E87154] text-sm whitespace-nowrap">
              IT'S MAGIC
            </div>
            <Sparkles className="absolute top-4 right-4 text-white fill-white w-8 h-8 opacity-80" />
          </div>

        </div>
      </section>

      {/* Stats/Benefits Bar */}
      <section className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 mb-16">
        <div className="bg-white rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(75,46,131,0.1)] border border-slate-100 overflow-hidden relative">
          {/* Subtle top highlight for the card */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-[#E87154] to-orange-400 opacity-80" />
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <DollarSign className="w-6 h-6 text-slate-400 mb-1" />
              <h4 className="text-2xl font-black text-slate-900">GHC 1,500</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Per Month</p>
            </div>
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <Clock className="w-6 h-6 text-slate-400 mb-1" />
              <h4 className="text-2xl font-black text-slate-900">~5 Hours</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daily Mon-Fri</p>
            </div>
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <MapPin className="w-6 h-6 text-slate-400 mb-1" />
              <h4 className="text-2xl font-black text-slate-900">10AM–6PM</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Schedule</p>
            </div>
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <Users className="w-6 h-6 text-slate-400 mb-1" />
              <h4 className="text-2xl font-black text-slate-900">Ages 3–12</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Children</p>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="scroll-mt-32 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center mb-16">
          <p className="text-[#E87154] font-bold tracking-wide text-sm mb-3">
            Take the stress out of the audition
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Skills we look for in our facilitators
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          
          {/* Skill 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="h-48 mb-6 flex items-center justify-center w-full">
              <StorytellingIllustration />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Interactive Storytelling</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">
              More than just reading words on a page. We look for the ability to captivate children using voice modulation, expression, and pacing.
            </p>
          </div>

          {/* Skill 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="h-48 mb-6 flex items-center justify-center w-full">
              <EngagementIllustration />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Child Engagement</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">
              The ability to hold attention, encourage participation, and build a warm, inclusive environment where every child feels seen.
            </p>
          </div>

          {/* Skill 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="h-48 mb-6 flex items-center justify-center w-full">
              <ImprovisationIllustration />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Creative Improvisation</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">
              Children are unpredictable! We assess your ability to adapt, pivot, and turn unexpected moments into magical learning opportunities.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}
