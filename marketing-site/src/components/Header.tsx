"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, X, ArrowUpRight, User, BookOpen, ChevronDown, Sparkles } from "lucide-react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("#hero");

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // IntersectionObserver for Scroll Spy
  useEffect(() => {
    const sectionIds = ["hero", "about", "products", "how-it-works", "pricing", "testimonials", "ambassador"];
    const observers = sectionIds.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(`#${id}`);
            }
          });
        },
        {
          rootMargin: "-30% 0px -50% 0px", // Trigger when the section occupies the central zone
        }
      );
      observer.observe(el);
      return { observer, el };
    });

    const handleScrollTop = () => {
      if (window.scrollY < 80) {
        setActiveSection("#hero");
      }
    };
    window.addEventListener("scroll", handleScrollTop);

    return () => {
      window.removeEventListener("scroll", handleScrollTop);
      observers.forEach((obs) => {
        if (obs) {
          obs.observer.unobserve(obs.el);
        }
      });
    };
  }, []);

  const navItems = [
    { label: "Home", href: "#hero" },
    { label: "About", href: "#about" },
    { label: "Products", href: "#products" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Ambassador", href: "#ambassador" },
  ];

  return (
    <header className="sticky top-0 left-0 w-full z-50 pointer-events-none transition-all duration-500 py-3">
      {/* Morphing Nav Container - Centered grid/flex layout */}
      <div
        className={`mx-auto flex items-center pointer-events-auto transition-all duration-500 ${
          isScrolled
            ? "w-[92%] max-w-[60rem] bg-[#302824] border-2 border-brand-coral/20 px-4 py-2 rounded-full shadow-2xl mt-1.5"
            : "w-full max-w-7xl min-[1700px]:max-w-[100rem] bg-brand-purple/80 backdrop-blur-md border-b border-brand-coral/10 px-6 py-5.5 rounded-none shadow-none"
        }`}
      >
        {/* Left Column: Brand Logo */}
        <div className="flex-1 flex justify-start items-center flex-shrink-0">
          {isScrolled ? (
            <a
              href="#hero"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#302824] p-1.5 transition hover:opacity-95"
            >
              <Image
                src="/logo-v2.png"
                alt="Land of Fairy Tales Logo"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
            </a>
          ) : (
            <a href="#hero" className="flex items-center gap-2 transition hover:opacity-90">
              <Image
                src="/logo-v2.png"
                alt="Land of Fairy Tales Logo"
                width={44}
                height={44}
                className="h-10 w-auto object-contain"
                priority
              />
            </a>
          )}
        </div>

        {/* Center Column: Desktop Navigation Items */}
        <div className="hidden md:flex flex-initial justify-center items-center">
          <nav className={`flex items-center transition-all duration-500 ${
            isScrolled ? "gap-1.5 lg:gap-2.5" : "gap-4 lg:gap-7 xl:gap-9"
          }`}>
            {navItems.map((item, index) => {
              const isActive = activeSection === item.href;
              if (isScrolled) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`transition-all duration-300 rounded-full px-3 py-1.5 text-xs font-bold flex items-center ${
                      isActive
                        ? "bg-brand-green text-text-dark font-black px-3.5 py-1.5 border border-[#302824]/10 shadow-sm scale-102"
                        : "text-[#FAF5EF]/75 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    {item.label}
                  </a>
                );
              }

              // Unscrolled State (expanded / light background): Clean flat text, no background pills or badges
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`transition-all duration-300 px-3.5 py-2 text-sm rounded-full ${
                    isActive
                      ? "text-brand-coral font-black"
                      : "font-semibold text-text-dark/80 hover:text-brand-coral hover:bg-brand-coral/5"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Right Column: CTA Actions (Desktop) */}
        <div className="flex-1 flex justify-end items-center gap-4 flex-shrink-0">
          <div className="hidden md:flex items-center gap-4">
            {isScrolled ? (
              <div className="relative group">
                <button className="bg-[#FAF5EF] text-[#302824] hover:bg-white transition-all rounded-full px-4.5 py-2 text-xs font-black shadow-sm border border-[#302824]/20 flex items-center gap-1 cursor-pointer">
                  Portal Login
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                
                {/* Floating Dropdown - Gapless layout using padding bridge */}
                <div className="absolute right-0 top-full pt-2 w-56 z-50 hidden group-hover:block transition-all duration-300">
                  <div className="bg-white border-2 border-[#302824] rounded-2xl p-2.5 shadow-lg space-y-1">
                    <a
                      href="https://app.landoffairytales.com/child"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-text-dark hover:bg-brand-green/20 rounded-xl transition"
                    >
                      <div className="w-6 h-6 rounded-lg bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-3.5 h-3.5" style={{ color: "#4A6B3D" }} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-[#302824]">Child Reading Room</span>
                        <span className="text-[9px] text-text-muted font-medium">3D books & streaks</span>
                      </div>
                    </a>
                    
                    <a
                      href="https://app.landoffairytales.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-text-dark hover:bg-brand-purple/20 rounded-xl transition"
                    >
                      <div className="w-6 h-6 rounded-lg bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5" style={{ color: "#6A548E" }} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-[#302824]">Parent Portal</span>
                        <span className="text-[9px] text-text-muted font-medium">Manage kids & reports</span>
                      </div>
                    </a>

                    <a
                      href="https://app.landoffairytales.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-text-dark hover:bg-brand-orange/20 rounded-xl transition"
                    >
                      <div className="w-6 h-6 rounded-lg bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-3.5 h-3.5" style={{ color: "#A06E38" }} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-[#302824]">Ambassador Portal</span>
                        <span className="text-[9px] text-text-muted font-medium">Affiliate metrics & tools</span>
                      </div>
                    </a>
                    
                    <hr className="border-text-dark/5 my-1.5" />
                    
                    <a
                      href="https://app.landoffairytales.com/auth/register"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-3 py-2.5 text-xs font-black text-white bg-brand-coral hover:bg-brand-coral/95 rounded-xl transition text-center shadow-soft btn-springy"
                    >
                      Start Your Journey
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4.5">
                <div className="relative group">
                  <button className="bg-white text-text-dark hover:bg-brand-cream/80 transition-all rounded-full px-4.5 py-2.5 text-sm font-bold border border-text-dark/15 flex items-center gap-1.5 cursor-pointer shadow-sm">
                    Portal Login
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  </button>
                  
                  {/* Floating Dropdown - Gapless layout using padding bridge */}
                  <div className="absolute right-0 top-full pt-2 w-56 z-50 hidden group-hover:block transition-all duration-300">
                    <div className="bg-white border-2 border-[#302824] rounded-2xl p-2.5 shadow-lg space-y-1">
                      <a
                        href="https://app.landoffairytales.com/child"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-text-dark hover:bg-brand-green/20 rounded-xl transition"
                      >
                        <div className="w-6 h-6 rounded-lg bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-3.5 h-3.5" style={{ color: "#4A6B3D" }} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-[#302824]">Child Reading Room</span>
                          <span className="text-[9px] text-text-muted font-medium">3D books & streaks</span>
                        </div>
                      </a>
                      
                      <a
                        href="https://app.landoffairytales.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-text-dark hover:bg-brand-purple/20 rounded-xl transition"
                      >
                        <div className="w-6 h-6 rounded-lg bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-3.5 h-3.5" style={{ color: "#6A548E" }} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-[#302824]">Parent Portal</span>
                          <span className="text-[9px] text-text-muted font-medium">Manage kids & reports</span>
                        </div>
                      </a>

                      <a
                        href="https://app.landoffairytales.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-text-dark hover:bg-brand-orange/20 rounded-xl transition"
                      >
                        <div className="w-6 h-6 rounded-lg bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-3.5 h-3.5" style={{ color: "#A06E38" }} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-[#302824]">Ambassador Portal</span>
                          <span className="text-[9px] text-text-muted font-medium">Affiliate metrics & tools</span>
                        </div>
                      </a>
                      
                      <hr className="border-text-dark/5 my-1.5" />
                      
                      <a
                        href="https://app.landoffairytales.com/auth/register"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-3 py-2.5 text-xs font-black text-white bg-brand-coral hover:bg-brand-coral/95 rounded-xl transition text-center shadow-soft btn-springy"
                      >
                        Start Your Journey
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 md:hidden rounded-xl transition-all cursor-pointer ${
              isScrolled
                ? "text-[#FAF5EF] hover:text-brand-coral"
                : "text-text-dark hover:text-brand-coral"
            }`}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div
          className={`md:hidden mx-auto w-[92%] mt-2 rounded-3xl border-2 border-[#302824] px-6 py-5 space-y-5 shadow-2xl max-h-[75vh] overflow-y-auto pointer-events-auto ${
            isScrolled
              ? "bg-[#302824] text-[#FAF5EF]"
              : "bg-brand-purple text-text-dark border-brand-coral/10"
          }`}
        >
          <nav className="flex flex-col gap-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`text-sm font-bold transition py-2 ${
                  isScrolled
                    ? "text-[#FAF5EF]/90 hover:text-brand-coral"
                    : "text-text-dark/80 hover:text-brand-coral"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          
          <hr className={isScrolled ? "border-white/10" : "border-brand-coral/10"} />
          
          <div className="flex flex-col gap-3">
            <a
              href="https://app.landoffairytales.com/child"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 py-3 text-xs font-black rounded-full border transition ${
                isScrolled
                  ? "bg-white/5 border-white/20 text-[#FAF5EF] hover:bg-white/10"
                  : "bg-white border-[#302824]/20 text-text-dark hover:bg-brand-cream"
              }`}
            >
              <BookOpen className="w-4 h-4 text-brand-green-dark" style={{ color: "#4A6B3D" }} />
              Child Reading Room
            </a>
            <a
              href="https://app.landoffairytales.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 py-3 text-xs font-black rounded-full border transition ${
                isScrolled
                  ? "bg-white/5 border-white/20 text-[#FAF5EF] hover:bg-white/10"
                  : "bg-white border-[#302824]/20 text-text-dark hover:bg-brand-cream"
              }`}
            >
              <User className="w-4 h-4 text-brand-purple-dark" style={{ color: "#6A548E" }} />
              Parent Portal
            </a>
            <a
              href="https://app.landoffairytales.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 py-3 text-xs font-black rounded-full border transition ${
                isScrolled
                  ? "bg-white/5 border-white/20 text-[#FAF5EF] hover:bg-white/10"
                  : "bg-white border-[#302824]/20 text-text-dark hover:bg-brand-cream"
              }`}
            >
              <Sparkles className="w-4 h-4 text-brand-orange-dark" style={{ color: "#A06E38" }} />
              Ambassador Portal
            </a>
            <a
              href="https://app.landoffairytales.com/auth/register"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center py-3.5 text-xs font-black text-white bg-brand-coral rounded-full shadow-soft hover:bg-brand-coral/90 transition btn-springy"
            >
              Start Your Journey
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
