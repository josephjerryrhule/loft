"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { X, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { preloadPageFlipSound, playPageFlip } from "@/lib/howler-wrapper";

const HTMLFlipBook = dynamic(() => import("react-pageflip"), { ssr: false });

interface ManifestPage {
  url: string;
  width: number;
  height: number;
}

export interface LoftFlipbookViewerProps {
  iframeContent?: string;
  pages?: ManifestPage[];
  onClose: () => void;
  title?: string;
  initialPage?: number;
  onComplete?: () => void;
}

const IFRAME_LOAD_TIMEOUT_MS = 8000;
const MUTE_STORAGE_KEY = "loft.flipbook.muted";

export function LoftFlipbookViewer({
  iframeContent,
  pages,
  onClose,
  title,
  initialPage = 0,
  onComplete,
}: LoftFlipbookViewerProps) {
  const [iframeFailed, setIframeFailed] = useState(false);
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(MUTE_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [dimensions, setDimensions] = useState({ width: 600, height: 800 });
  const flipRef = useRef<any>(null);

  const useIframe = Boolean(iframeContent) && !iframeFailed;
  const useSelfHost = !useIframe && pages && pages.length > 0;

  useEffect(() => {
    if (useSelfHost) preloadPageFlipSound();
  }, [useSelfHost]);

  // Iframe timeout watchdog
  useEffect(() => {
    if (!iframeContent || iframeFailed) return;
    const t = setTimeout(() => setIframeFailed(true), IFRAME_LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [iframeContent, iframeFailed]);

  // Responsive sizing for the self-host flipbook
  useEffect(() => {
    if (!useSelfHost) return;
    const recalc = () => {
      const w = Math.min(window.innerWidth * 0.9, 900);
      const h = Math.min(window.innerHeight * 0.85, 1200);
      setDimensions({ width: Math.floor(w / 2) * 2, height: Math.floor(h) });
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [useSelfHost]);

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      try {
        localStorage.setItem(MUTE_STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  const onFlipHandler = (e: any) => {
    if (!muted) playPageFlip();
    if (pages && e?.data === pages.length - 1 && onComplete) onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition"
      >
        <X className="h-5 w-5" />
      </button>

      {title && (
        <div className="absolute top-4 left-4 z-10 text-white font-bold tracking-wide">{title}</div>
      )}

      {useSelfHost && (
        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="absolute top-4 right-16 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition"
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      )}

      {useIframe && iframeContent && (
        <iframe
          srcDoc={iframeContent}
          className="w-[95vw] h-[90vh] border-0 rounded-lg"
          onError={() => setIframeFailed(true)}
        />
      )}

      {useSelfHost && pages && (
        // @ts-expect-error — react-pageflip IProps has non-optional fields with sensible defaults
        <HTMLFlipBook
          width={dimensions.width / 2}
          height={dimensions.height}
          style={{}}
          size="stretch"
          minWidth={300}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1200}
          drawShadow
          flippingTime={700}
          usePortrait
          startZIndex={0}
          autoSize
          maxShadowOpacity={0.5}
          showCover
          mobileScrollSupport
          startPage={initialPage}
          ref={flipRef}
          onFlip={onFlipHandler}
          className="loft-flipbook"
        >
          {pages.map((p, idx) => (
            <div key={idx} className="page bg-white">
              <img
                src={p.url}
                alt={`Page ${idx + 1}`}
                loading="lazy"
                draggable={false}
                className="w-full h-full object-contain pointer-events-none select-none"
              />
            </div>
          ))}
        </HTMLFlipBook>
      )}

      {!useIframe && !useSelfHost && (
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <h2 className="text-xl font-black mb-2">Flipbook unavailable</h2>
          <p className="text-slate-500 mb-4">
            We couldn't load this flipbook right now. Try again later or contact support.
          </p>
          <Button onClick={onClose}>Close</Button>
        </div>
      )}
    </div>
  );
}
