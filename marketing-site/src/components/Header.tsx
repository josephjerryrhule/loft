"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Menu, X, ArrowUpRight, User, BookOpen, ChevronDown } from "lucide-react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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

  const navItems = [
    { label: "Home", href: "#hero" },
    { label: "About LOFT", href: "#about" },
    { label: "Products", href: "#products" },
    { label: "Plans & Pricing", href: "#pricing" },
    { label: "Ambassador Programme", href: "#ambassador" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 pointer-events-none transition-all duration-500 py-3">
      {/* Morphing Nav Container */}
      <div
        className={`mx-auto flex items-center justify-between pointer-events-auto transition-all duration-500 ${
          isScrolled
            ? "w-[92%] max-w-4xl bg-[#302824] border-2 border-brand-coral/20 px-4 py-2.5 rounded-full shadow-2xl mt-1.5"
            : "w-full max-w-7xl min-[1700px]:max-w-[100rem] bg-brand-cream/80 backdrop-blur-md border-b border-brand-coral/10 px-6 py-4 rounded-none shadow-none"
        }`}
      >
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isScrolled ? (
            <a
              href="#hero"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#302824] p-1.5 transition hover:opacity-95"
            >
              <Image
                src="/logo-v2.png"
                alt="LOFT Logo"
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
                alt="LOFT Logo"
                width={44}
                height={44}
                className="h-10 w-auto object-contain"
                priority
              />
            </a>
          )}
        </div>

        {/* Center: Desktop Navigation Items */}
        <nav className="hidden md:flex items-center justify-center gap-2 lg:gap-4 flex-grow">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`transition-all ${
                isScrolled
                  ? "text-xs font-bold text-[#FAF5EF]/90 hover:text-white hover:bg-brand-green/20 rounded-full px-3.5 py-1.5"
                  : "text-sm font-semibold text-text-dark/80 hover:text-brand-coral px-3 py-1 hover:scale-102"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right: CTA Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-4 flex-shrink-0">
          {isScrolled ? (
            <div className="relative group">
              <button className="bg-[#FAF5EF] text-[#302824] hover:bg-white transition-all rounded-full px-4.5 py-2 text-xs font-black shadow-sm border border-[#302824]/20 flex items-center gap-1 cursor-pointer">
                Portal Login
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              
              {/* Floating Dropdown */}
              <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-[#302824] rounded-2xl p-2.5 shadow-lg hidden group-hover:block transition-all duration-300">
                <a
                  href="https://app.landoffairytales.com/child/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-text-dark hover:bg-brand-green/20 rounded-xl transition"
                >
                  <BookOpen className="w-3.5 h-3.5 text-brand-coral" />
                  Child Reading Room
                </a>
                <a
                  href="https://app.landoffairytales.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-text-dark hover:bg-brand-purple/20 rounded-xl transition"
                >
                  <User className="w-3.5 h-3.5 text-brand-coral" />
                  Parent Portal
                </a>
                <a
                  href="https://app.landoffairytales.com/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2.5 text-xs font-black text-[#FAF5EF] bg-brand-coral hover:bg-brand-coral/90 rounded-xl transition mt-1.5 text-center shadow-soft"
                >
                  Start Your Journey
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4.5">
              <a
                href="https://app.landoffairytales.com/child/login"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-bold text-text-dark/80 hover:text-brand-coral transition"
              >
                <BookOpen className="w-4 h-4 text-brand-coral" />
                Child Login
              </a>
              <a
                href="https://app.landoffairytales.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-bold text-brand-coral hover:text-brand-coral/80 transition"
              >
                Parent Portal
                <ArrowUpRight className="w-4 h-4" />
              </a>
              <a
                href="https://app.landoffairytales.com/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-extrabold text-white bg-brand-coral shadow-soft hover:bg-brand-coral/90 transition shadow-card-hover btn-springy"
              >
                Start Your Journey
              </a>
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

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div
          className={`md:hidden mx-auto w-[92%] mt-2 rounded-3xl border-2 border-[#302824] px-6 py-5 space-y-5 shadow-2xl ${
            isScrolled
              ? "bg-[#302824] text-[#FAF5EF]"
              : "bg-brand-cream text-text-dark border-brand-coral/10"
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
              href="https://app.landoffairytales.com/child/login"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 py-3 text-xs font-black rounded-full border transition ${
                isScrolled
                  ? "bg-white/5 border-white/20 text-[#FAF5EF] hover:bg-white/10"
                  : "bg-white border-[#302824]/20 text-text-dark hover:bg-brand-cream"
              }`}
            >
              <BookOpen className="w-4 h-4 text-brand-coral" />
              Child Login
            </a>
            <a
              href="https://app.landoffairytales.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 py-3 text-xs font-black rounded-full border transition ${
                isScrolled
                  ? "bg-white/5 border-white/20 text-[#FAF5EF] hover:bg-white/10"
                  : "bg-white border-[#302824]/20 text-brand-coral hover:bg-brand-cream"
              }`}
            >
              Parent Portal
              <ArrowUpRight className="w-4 h-4" />
            </a>
            <a
              href="https://app.landoffairytales.com/signup"
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
