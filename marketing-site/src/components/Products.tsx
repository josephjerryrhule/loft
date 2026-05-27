"use client";

import React, { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, ArrowRight, Sparkles } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Products() {
  const [isMuted, setIsMuted] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Register ScrollTrigger inside useEffect to ensure window is defined
    gsap.registerPlugin(ScrollTrigger);

    const videoEl = videoRef.current;
    let playVideo: (() => void) | null = null;

    // Force video playback and muted status explicitly to bypass browser policies
    if (videoEl) {
      videoEl.defaultMuted = true;
      videoEl.muted = true;
      videoEl.setAttribute("muted", "");
      videoEl.setAttribute("autoplay", "");
      videoEl.setAttribute("playsinline", "");
      
      playVideo = () => {
        videoEl.play().catch(err => {
          console.log("Autoplay was prevented, waiting for interaction:", err);
        });
      };

      // Play immediately and also add event listeners as a fallback
      playVideo();
      videoEl.addEventListener("canplay", playVideo);
      videoEl.addEventListener("loadedmetadata", playVideo);
    }

    // GSAP context helps safely manage scroll animations and clean them up automatically
    const ctx = gsap.context(() => {
      if (videoWrapperRef.current && sectionRef.current) {
        const isMobile = window.innerWidth < 768;
        gsap.fromTo(
          videoWrapperRef.current,
          {
            width: isMobile ? "92%" : "80%",
            borderRadius: isMobile ? "1.5rem" : "2.5rem",
            borderWidth: "3px",
          },
          {
            width: "100%",
            borderRadius: "0rem",
            borderWidth: "0px",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 75%",
              end: "bottom 95%",
              scrub: 1,
            },
            ease: "power1.inOut",
          }
        );
      }
    });

    return () => {
      ctx.revert();
      if (videoEl && playVideo) {
        videoEl.removeEventListener("canplay", playVideo);
        videoEl.removeEventListener("loadedmetadata", playVideo);
      }
    };
  }, []);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <section
      id="products"
      ref={sectionRef}
      className="w-full py-20 bg-brand-cream/10 border-b border-brand-coral/5 overflow-visible"
    >
      <div className="mx-auto max-w-[100rem] overflow-visible">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4 px-6">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black text-[#302824] bg-[#F4C491] border-2 border-[#302824] shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Discover Land of Fairy Tales
          </span>
          <h2 className="text-3xl sm:text-4xl text-text-dark font-quicksand font-bold">
            Discover The World Of Land of Fairy Tales
          </h2>
          <p className="text-base sm:text-lg text-text-muted font-medium">
            Immersive reading experiences designed to build confidence, culture, and literacy.
          </p>
        </div>

        {/* Video Wrapper Container (Expands on Scroll) */}
        <div className="w-full overflow-hidden flex justify-center py-4">
          <div
            ref={videoWrapperRef}
            className="relative border-[3px] border-[#302824] bg-[#302824] shadow-soft aspect-[16/10] md:aspect-[21/9] w-[92%] md:w-[80%] rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden flex items-center justify-center"
          >
            {/* Background Autoplay Video */}
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover pointer-events-none select-none"
            >
              <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
            </video>



            {/* Floating Sound Control Button (Bottom Right) */}
            <button
              onClick={toggleSound}
              className="absolute bottom-4 right-4 z-20 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF5EF] backdrop-blur-md border border-white/20 transition-all active:scale-95 cursor-pointer shadow-md"
              aria-label={isMuted ? "Unmute video" : "Mute video"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>


        {/* CTA */}
        <div className="text-center mt-14 px-6">
          <a
            href="#pricing"
            className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-bold text-white bg-brand-coral hover:bg-brand-coral/90 transition-all shadow-soft btn-springy section-cta"
          >
            <span>See Our Plans</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 ml-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
        </div>

      </div>
    </section>
  );
}
