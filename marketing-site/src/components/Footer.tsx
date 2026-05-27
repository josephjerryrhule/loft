"use client";

import React from "react";
import { Mail, MapPin, ArrowRight } from "lucide-react";

// Inline social SVGs (clean and modern)
const FacebookIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5.14 1" />
    <path d="M17 8a5 5 0 0 0-5-5" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

// Cute wiggling sticker components for the bottom signature decoration
const WinkingSmileySticker = () => (
  <svg className="w-10 h-10 sm:w-16 sm:h-16 rotate-[-12deg] drop-shadow-md hover:scale-110 transition cursor-pointer" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="45" fill="#BFDBFE" stroke="#302824" strokeWidth="3" />
    <path d="M35 45 L45 45" stroke="#302824" strokeWidth="3" strokeLinecap="round" />
    <path d="M60 42 C62 40, 66 40, 68 42" fill="none" stroke="#302824" strokeWidth="3" strokeLinecap="round" />
    <circle cx="64" cy="44" r="1.5" fill="#302824" />
    <path d="M35 60 C40 68, 60 68, 65 60" fill="none" stroke="#302824" strokeWidth="3.5" strokeLinecap="round" />
  </svg>
);

const ReadStarSticker = () => (
  <svg className="w-10 h-10 sm:w-16 sm:h-16 rotate-[15deg] drop-shadow-md hover:scale-110 transition cursor-pointer" viewBox="0 0 100 100">
    <path
      d="M50 5 L63 35 L95 38 L70 60 L78 92 L50 75 L22 92 L30 60 L5 38 L37 35 Z"
      fill="#FED7AA"
      stroke="#302824"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <text
      x="50"
      y="57"
      fontFamily="sans-serif"
      fontSize="16"
      fontWeight="900"
      fill="#302824"
      textAnchor="middle"
      transform="rotate(-5, 50, 55)"
    >
      READ
    </text>
  </svg>
);

const PurpleBlobSticker = () => (
  <svg className="w-12 h-12 sm:w-20 sm:h-20 rotate-[-5deg] drop-shadow-md hover:scale-110 transition cursor-pointer" viewBox="0 0 100 100">
    <path
      d="M20 75 C12 70, 10 50, 20 40 C15 25, 30 22, 35 30 C42 12, 58 12, 65 30 C70 22, 85 25, 80 40 C90 50, 88 70, 80 75 Z"
      fill="#DDD6FE"
      stroke="#302824"
      strokeWidth="3.5"
    />
    <path d="M30 42 C32 40, 36 40, 38 42" stroke="#302824" strokeWidth="3" fill="none" />
    <path d="M50 42 C52 40, 56 40, 58 42" stroke="#302824" strokeWidth="3" fill="none" />
    <path d="M40 54 C43 57, 47 57, 50 54" stroke="#302824" strokeWidth="3" fill="none" />
  </svg>
);

export default function Footer() {
  const navItems = [
    { label: "Home", href: "#hero" },
    { label: "About LOFT", href: "#about" },
    { label: "Products", href: "#products" },
    { label: "Plans & Pricing", href: "#pricing" },
    { label: "Ambassador Programme", href: "#ambassador" },
  ];

  return (
    <footer className="w-full bg-brand-cream pt-16">
      {/* Brand Coral Card Container - Sits flush at page bottom, rounded top corners, side margins, wide layout */}
      <div className="mx-6 max-w-7xl min-[1700px]:max-w-[100rem] lg:mx-auto rounded-t-[2.5rem] bg-[#E87154] border-t-[3px] border-x-[3px] border-[#302824] text-white p-6 sm:p-10 md:p-16 pb-12 md:pb-16 relative overflow-hidden select-none">
        
        {/* Three-Column Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
          
          {/* Column 1: Explore (Quick Links) */}
          <div className="space-y-4">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white text-[#E87154] border border-[#302824] shadow-sm">
              explore
            </span>
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-lg sm:text-2xl font-quicksand font-bold text-white hover:text-brand-purple hover:underline decoration-2 transition leading-tight"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Office (Locations) */}
          <div className="space-y-4">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white text-[#E87154] border border-[#302824] shadow-sm">
              office
            </span>
            <div className="space-y-2">
              <p className="text-lg sm:text-2xl font-bold leading-tight font-sans">
                The East Wing - Parakuo link rd, Accra- Ghana
              </p>
              <p className="text-xs font-semibold text-white/70">
                Company reg no. CS259931125
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-sm font-semibold text-white/80 hover:text-white transition cursor-pointer">
                <MapPin className="w-4 h-4" />
                <span className="underline decoration-1">Google Maps</span>
              </div>
            </div>
          </div>

          {/* Column 3: Contact */}
          <div className="space-y-4">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white text-[#E87154] border border-[#302824] shadow-sm">
              contact
            </span>
            <div className="space-y-3">
              <a
                href="mailto:hello@landoffairytales.com"
                className="block text-lg sm:text-2xl font-bold leading-tight font-sans hover:underline decoration-2"
              >
                hello@landoffairytales.com
              </a>
              
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-white/70">Telephone</p>
                <div className="flex flex-col gap-1 text-base sm:text-lg font-bold">
                  <a href="tel:+233559922299" className="hover:underline hover:text-brand-purple transition">
                    +233 (0) 55 992 2299
                  </a>
                  <a href="tel:+447907602402" className="hover:underline hover:text-brand-purple transition">
                    +447907602402
                  </a>
                </div>
              </div>

              {/* Social Icons row inside column */}
              <div className="flex gap-4 pt-3">
                {[
                  { icon: <FacebookIcon />, href: "https://www.facebook.com/Loftbookclub" },
                  { icon: <InstagramIcon />, href: "https://www.instagram.com/loftbookclub?igsh=bGx3N2dxdzdib3Ru&utm_source=qr" },
                  { icon: <TikTokIcon />, href: "https://www.tiktok.com/@loftbookclub?_t=ZM-8zB5lDZR0cC&_r=1" },
                ].map((soc, idx) => (
                  <a
                    key={idx}
                    href={soc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full border-2 border-[#302824] bg-white text-[#302824] hover:bg-brand-purple hover:text-text-dark flex items-center justify-center transition shadow-sm"
                  >
                    {soc.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Dynamic Massive Bottom Brand Signature with Stickers */}
        <div className="relative mt-20 pt-10 border-t border-white/10 flex flex-col items-center justify-center min-h-[140px] z-10 select-none">
          
          {/* Massive background text signature */}
          <span className="text-[6.5rem] sm:text-[10rem] md:text-[13rem] font-quicksand font-extrabold uppercase tracking-widest text-white opacity-20 select-none pointer-events-none leading-none">
            loft
          </span>

          {/* Overlapping stickers */}
          <div className="absolute top-[35%] left-[5%] sm:left-[20%] z-20">
            <WinkingSmileySticker />
          </div>
          <div className="absolute top-[40%] right-[5%] sm:right-[22%] z-20">
            <ReadStarSticker />
          </div>
          <div className="absolute top-[15%] sm:top-[18%] left-[42%] sm:left-[45%] z-20">
            <PurpleBlobSticker />
          </div>
        </div>

        {/* Inset Footer Metadata Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 text-[10px] sm:text-xs font-bold text-white/70">
          <p className="text-center sm:text-left">
            &copy; 2026 Land of Fairy Tales (LOFT). All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-brand-purple hover:underline">Privacy Policy</a>
            <span>&middot;</span>
            <a href="#" className="hover:text-brand-purple hover:underline">Terms of Use</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
