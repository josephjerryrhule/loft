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
        gsap.fromTo(
          videoWrapperRef.current,
          {
            width: "80%",
            borderRadius: "2.5rem",
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-brand-coral bg-brand-coral/5 border border-brand-coral/10">
            <Sparkles className="w-3.5 h-3.5" />
            Discover LOFT
          </span>
          <h2 className="text-3xl sm:text-4xl text-text-dark font-quicksand font-bold">
            Discover The World Of LOFT
          </h2>
          <p className="text-base sm:text-lg text-text-muted font-medium">
            Immersive reading experiences designed to build confidence, culture, and literacy.
          </p>
        </div>

        {/* Video Wrapper Container (Expands on Scroll) */}
        <div className="w-full overflow-hidden flex justify-center py-4">
          <div
            ref={videoWrapperRef}
            className="relative border-[3px] border-[#302824] bg-[#302824] shadow-soft aspect-[21/9] sm:aspect-[21/9] overflow-hidden flex items-center justify-center"
            style={{ width: "80%", borderRadius: "2.5rem" }}
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

        {/* Three Columns below Video (Connects to standard margins) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-7xl min-[1700px]:max-w-[100rem] mx-auto px-6">
          <div className="space-y-3 p-6 rounded-2xl bg-brand-cream/40 border border-[#302824]/5 shadow-soft">
            <span className="text-xs font-black text-brand-coral">01 Interactive Stories</span>
            <h4 className="text-base font-bold text-text-dark">Explore wiggling 3D flipbooks</h4>
            <p className="text-xs font-semibold text-text-muted leading-relaxed">
              Open magical books where children guide their own reading adventure, tap words for audio assistance, and earn achievement badges.
            </p>
          </div>
          <div className="space-y-3 p-6 rounded-2xl bg-brand-cream/40 border border-[#302824]/5 shadow-soft">
            <span className="text-xs font-black text-brand-coral">02 Personalize & Grow</span>
            <h4 className="text-base font-bold text-text-dark">Custom Birthday Stories</h4>
            <p className="text-xs font-semibold text-text-muted leading-relaxed">
              Create keepsake stories dynamically woven with your child's name in Ashanti-inspired quests that build strong identity and confidence.
            </p>
          </div>
          <div className="space-y-3 p-6 rounded-2xl bg-brand-cream/40 border border-[#302824]/5 shadow-soft">
            <span className="text-xs font-black text-brand-coral">03 Share & Earn Rewards</span>
            <h4 className="text-base font-bold text-text-dark">Ambassador Network</h4>
            <p className="text-xs font-semibold text-text-muted leading-relaxed">
              Introduce LOFT to schools in your area and earn up to 20% direct commissions and override percentages paid weekly into your MoMo wallet.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
