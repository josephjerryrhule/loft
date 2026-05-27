"use client";

import React, { useEffect } from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Partners from "../components/Partners";
import About from "../components/About";
import WhyUs from "../components/WhyUs";
import Stories from "../components/Stories";
import Products from "../components/Products";
import HowItWorks from "../components/HowItWorks";
import Pricing from "../components/Pricing";
import BirthdayBooks from "../components/BirthdayBooks";
import Testimonials from "../components/Testimonials";
import Ambassador from "../components/Ambassador";
import FAQ from "../components/FAQ";
import Gateway from "../components/Gateway";
import Footer from "../components/Footer";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Home() {
  useEffect(() => {
    // Register GSAP ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Get all sections on the page
    const sections = document.querySelectorAll("section");

    sections.forEach((section) => {
      // For the hero section, animate immediately on load with staggers
      if (section.id === "hero") {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.fromTo(section, { opacity: 0 }, { opacity: 1, duration: 0.8 })
          .fromTo(section.querySelectorAll("h1, p, a, .hero-element"), 
            { opacity: 0, y: 30 }, 
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.15 },
            "-=0.5"
          );
        return;
      }

      // Create a ScrollTriggered Timeline for all other sections
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 85%", // Starts animating when top of section is 85% from top of viewport
          toggleActions: "play none none none",
          once: true, // Only play once to keep scroll fluid and fast
        }
      });

      // 1. Gently fade in the section container background first
      tl.fromTo(section, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.5, ease: "power2.out" }
      );

      // 2. Animate inner header text elements (badges, titles, subtitles)
      const headers = section.querySelectorAll("h2, p.text-base, p.text-lg, span.inline-flex, .section-header");
      if (headers.length > 0) {
        tl.fromTo(headers,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: "power2.out" },
          "-=0.3"
        );
      }

      // 3. Animate inner interactive content elements (cards, grids, carousels, clouds, fanned mockups)
      const contentItems = section.querySelectorAll(".card-organic, .grid > div, .marquee-track, .testimonial-cloud, .fanned-books-container, .steps-container > div");
      if (contentItems.length > 0) {
        tl.fromTo(contentItems,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" },
          "-=0.4"
        );
      }

      // 4. Animate CTA/Action elements
      const ctas = section.querySelectorAll("a.btn-springy, button.btn-springy, .section-cta");
      if (ctas.length > 0) {
        tl.fromTo(ctas,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.5)" },
          "-=0.3"
        );
      }
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Dynamic Header */}
      <Header />

      <main className="flex-grow">
        {/* Section 1: Hero */}
        <Hero />

        {/* Brand Partners Marquee */}
        <Partners />

        {/* Section 2: About (What is LOFT?) */}
        <About />

        {/* Section 3: Why Families Love LOFT */}
        <WhyUs />

        {/* Section 4: Stories That Feel Like Home */}
        <Stories />

        {/* Section 5: Products & Experiences (GSAP Scroll Video Banner) */}
        <Products />

        {/* Section 6: How LOFT Works */}
        <HowItWorks />

        {/* Section 7: Plans & Pricing */}
        <Pricing />

        {/* Section 8: Personalized Birthday Books (Bespoke Keepsakes) */}
        <BirthdayBooks />

        {/* Section 9: Testimonials (Paywall avatar cloud) */}
        <Testimonials />

        {/* Section 10: Ambassador Programme */}
        <Ambassador />

        {/* Section 11: Frequently Asked Questions */}
        <FAQ />

        {/* Section 12: Portal Gateway */}
        <Gateway />
      </main>

      {/* Section 12: Footer */}
      <Footer />
    </div>
  );
}
