"use client";

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, X, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Dynamically import flipbook
const HTMLFlipBook = dynamic(() => import('react-pageflip'), { ssr: false });

interface ReliableFlipbookViewerProps {
    pdfUrl?: string; // Made optional
    iframeContent?: string; // New prop for oEmbed HTML
    onClose: () => void;
    title?: string;
    initialPage?: number;
    onComplete?: () => void;
}

export function ReliableFlipbookViewer({ 
    pdfUrl, 
    iframeContent,
    onClose, 
    title, 
    initialPage = 0, 
    onComplete 
}: ReliableFlipbookViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(initialPage);
    const [pageImages, setPageImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [dimensions, setDimensions] = useState({ width: 600, height: 800 });
    const [isMobile, setIsMobile] = useState(false);
    const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
    const bookRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const initialLoadRef = useRef(false);

    // Initialize audio with actual sound file
    useEffect(() => {
        const audio = new Audio('/sounds/page-flip.mp3');
        audio.volume = 0.3; // Set volume to 30% so it's not too loud
        audio.preload = 'auto';
        audioRef.current = audio;
        
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        // If we have iframe content, we don't need to load PDF
        if (iframeContent) {
            setLoading(false);
            return;
        }

        if (!pdfUrl) {
            setError("No content available");
            setLoading(false);
            return;
        }

        // Prevent re-loading if PDF is already loaded
        if (initialLoadRef.current && pageImages.length > 0) {
            return;
        }
        
        let isMounted = true;
        initialLoadRef.current = true;
        
        const loadPDF = async () => {
            try {
                setLoading(true);
                
                // Fetch via proxy
                const proxyUrl = `/api/proxy-pdf?url=${encodeURIComponent(pdfUrl)}`;
                const response = await fetch(proxyUrl);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch PDF: ${response.statusText}`);
                }
                
                const pdfData = await response.arrayBuffer();
                
                // Load PDF with PDF.js
                const loadingTask = pdfjsLib.getDocument({ data: pdfData });
                const pdf = await loadingTask.promise;
                
                if (!isMounted) return;
                
                setNumPages(pdf.numPages);
                
                // Render all pages to images
                const images: string[] = [];
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    if (!isMounted) break;
                    
                    const page = await pdf.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 1.5 });
                    
                    // Create canvas
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    
                    if (context) {
                        const renderContext = {
                            canvasContext: context,
                            viewport: viewport
                        };
                        await page.render(renderContext as any).promise;
                        const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
                        images.push(imageUrl);
                        
                        const progress = Math.round((pageNum / pdf.numPages) * 100);
                        setLoadingProgress(progress);
                    }
                }
                
                if (!isMounted) return;
                
                setPageImages(images);
                setLoading(false);
                
                // Jump to initial page
                if (initialPage > 0) {
                    setTimeout(() => {
                        bookRef.current?.pageFlip()?.turnToPage(initialPage);
                    }, 500);
                }
            } catch (err: any) {
                if (!isMounted) return;
                console.error('❌ Error loading PDF:', err);
                setError(err.message || 'Failed to load PDF');
                setLoading(false);
            }
        };
        
        loadPDF();
        
        return () => {
            isMounted = false;
        };
    }, [pdfUrl, initialPage, iframeContent]);

    // Responsive sizing
    useEffect(() => {
        const handleResize = () => {
            const isMobileDevice = window.innerWidth < 768;
            setIsMobile(isMobileDevice);
            
            if (isMobileDevice) {
                // Mobile: single page, use most of the screen
                const maxWidth = window.innerWidth * 0.9;
                const maxHeight = window.innerHeight * 0.65;
                setDimensions({ width: maxWidth, height: maxHeight });
            } else {
                // Desktop: two-page spread
                const maxWidth = window.innerWidth * 0.45;
                const maxHeight = window.innerHeight * 0.8;
                setDimensions({ width: maxWidth, height: maxHeight });
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (iframeContent) return; // Disable keyboard nav for iframe as it captures focus or has its own
            if (e.key === "ArrowRight") bookRef.current?.pageFlip()?.flipNext();
            if (e.key === "ArrowLeft") bookRef.current?.pageFlip()?.flipPrev();
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose, iframeContent]);

    const handlePageChange = (pageData: any) => {
        // Extract page number from the event object
        let page: number;
        if (typeof pageData === 'number') {
            page = pageData;
        } else if (pageData && typeof pageData.data === 'number') {
            page = pageData.data;
        } else {
            console.warn('Unexpected page data format:', pageData);
            return;
        }
        
        setCurrentPage(page);
        
        // Play flip sound
        if (audioRef.current) {
            try {
                audioRef.current.currentTime = 0; // Reset to start
                audioRef.current.play().catch(() => {
                    // Ignore if autoplay is blocked
                });
            } catch (err) {
                // Ignore audio errors
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl flex flex-col items-center justify-center overflow-hidden select-none">
            {/* Ambient Background Glows */}
            <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-[#E87154]/10 blur-[120px] pointer-events-none -z-10 animate-pulse" />
            <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-[#E87154]/5 blur-[120px] pointer-events-none -z-10 animate-pulse" style={{ animationDelay: '2s' }} />

            {/* Elegant Top Header Bar */}
            <div className="absolute top-0 left-0 right-0 h-20 bg-slate-950/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-50 shadow-sm">
                <div className="flex items-center gap-3 text-left">
                    <div className="h-9 w-9 rounded-xl bg-[#E87154]/20 flex items-center justify-center text-[#E87154] shrink-0">
                        <Sparkles size={16} className="animate-pulse" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#E87154] leading-none">LOFT Reader</h3>
                        <h2 className="text-sm font-bold text-white mt-1.5 leading-none truncate max-w-[200px] sm:max-w-md">{title || "Book Preview"}</h2>
                    </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onClose} 
                    className="text-white/60 hover:text-white hover:bg-white/10 rounded-full h-11 w-11 transition-all active:scale-95 border border-white/5 shadow-inner shrink-0"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center gap-4 max-w-md">
                    <Loader2 className="h-12 w-12 animate-spin text-[#E87154]" />
                    <p className="text-white text-base font-bold uppercase tracking-wider">Loading book content...</p>
                    {pdfUrl && !iframeContent && (
                        <>
                            <div className="w-64 bg-white/10 rounded-full h-2 overflow-hidden shadow-inner border border-white/5">
                                <div 
                                    className="bg-[#E87154] h-full transition-all duration-300"
                                    style={{ width: `${loadingProgress}%` }}
                                />
                            </div>
                            <p className="text-white/60 text-xs font-semibold">{loadingProgress}% - Rendering book spreads</p>
                        </>
                    )}
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="flex flex-col items-center gap-4 max-w-md text-center">
                    <div className="text-red-500 text-6xl">⚠️</div>
                    <p className="text-white text-lg font-bold">{error}</p>
                    <Button onClick={onClose} variant="outline" className="border-white/20 text-white hover:bg-white/10">Close</Button>
                </div>
            )}

            {/* Iframe View (Heyzine) */}
            {!loading && !error && iframeContent && (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-10 pt-24 pb-28">
                    <div 
                        className="w-full h-full max-w-7xl relative [&>iframe]:w-full! [&>iframe]:h-full! [&>iframe]:border-0 rounded-2xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]"
                        dangerouslySetInnerHTML={{ __html: iframeContent }}
                    />
                    
                    {/* Manual Complete Button for Iframe */}
                    {onComplete && !hasMarkedComplete && (
                         <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                            <Button
                                onClick={() => {
                                    if (!hasMarkedComplete) {
                                        setHasMarkedComplete(true);
                                        onComplete();
                                    }
                                }}
                                className="bg-[#E87154] hover:bg-[#D66144] text-white font-black px-6 py-2.5 rounded-full shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                            >
                                Mark as Completed
                            </Button>
                         </div>
                    )}
                </div>
            )}

            {/* PDF Flipbook */}
            {!loading && !error && !iframeContent && pageImages.length > 0 && (
                <div className="flex-1 flex flex-col items-center justify-center w-full relative pb-28 md:pb-0 pt-20">
                    <div className="relative shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)] rounded-2xl overflow-hidden">
                        {/* 3D Book Cover Glow */}
                        <div className="absolute inset-0 bg-[#E87154]/5 blur-[40px] pointer-events-none -z-10" />
                        
                        <HTMLFlipBook
                            ref={bookRef}
                            width={dimensions.width}
                            height={dimensions.height}
                            size="stretch"
                            minWidth={300}
                            maxWidth={1000}
                            minHeight={400}
                            maxHeight={1400}
                            drawShadow={true}
                            flippingTime={600}
                            usePortrait={isMobile}
                            startPage={initialPage}
                            className="flipbook"
                            style={{}}
                            startZIndex={0}
                            autoSize={true}
                            maxShadowOpacity={0.5}
                            showCover={false}
                            mobileScrollSupport={true}
                            clickEventForward={true}
                            useMouseEvents={true}
                            swipeDistance={30}
                            showPageCorners={true}
                            disableFlipByClick={false}
                            onFlip={handlePageChange}
                        >
                            {pageImages.map((imageUrl, index) => (
                                <div key={index} className="bg-white shadow-2xl flex items-center justify-center relative overflow-hidden group select-none">
                                    <img 
                                        src={imageUrl} 
                                        alt={`Page ${index + 1}`}
                                        className="w-full h-full object-contain"
                                        draggable={false}
                                    />
                                    {/* 3D Page Crease Shadow Overlay */}
                                    {index % 2 === 0 ? (
                                        <div className="absolute top-0 right-0 w-[5%] h-full bg-gradient-to-r from-transparent to-black/15 pointer-events-none z-10" />
                                    ) : (
                                        <div className="absolute top-0 left-0 w-[5%] h-full bg-gradient-to-l from-transparent to-black/15 pointer-events-none z-10" />
                                    )}
                                    {/* Page edge lighting */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/5 pointer-events-none z-10" />
                                </div>
                            ))}
                        </HTMLFlipBook>
                    </div>

                    {/* Navigation Controls - Desktop: sides, Mobile: bottom */}
                    <div className="hidden md:block">
                        <button
                            onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                            disabled={currentPage === 0}
                            className={cn(
                                "absolute left-6 top-1/2 -translate-y-1/2 z-50",
                                "bg-slate-900/60 hover:bg-[#E87154] text-white p-4 rounded-full shadow-2xl backdrop-blur-md border border-white/10",
                                "disabled:opacity-20 disabled:cursor-not-allowed",
                                "transition-all duration-300 hover:scale-110 active:scale-95"
                            )}
                        >
                            <ChevronLeft className="h-6 w-6 stroke-[3px]" />
                        </button>
                        <button
                            onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                            disabled={currentPage >= numPages - 1}
                            className={cn(
                                "absolute right-6 top-1/2 -translate-y-1/2 z-50",
                                "bg-slate-900/60 hover:bg-[#E87154] text-white p-4 rounded-full shadow-2xl backdrop-blur-md border border-white/10",
                                "disabled:opacity-20 disabled:cursor-not-allowed",
                                "transition-all duration-300 hover:scale-110 active:scale-95"
                            )}
                        >
                            <ChevronRight className="h-6 w-6 stroke-[3px]" />
                        </button>
                    </div>

                    {/* Mobile Navigation - Bottom (both portrait and landscape) */}
                    <div className="md:hidden fixed bottom-24 left-0 right-0 flex justify-center gap-6 z-50 px-4">
                        <button
                            onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                            disabled={currentPage === 0}
                            className={cn(
                                "bg-slate-900/60 hover:bg-[#E87154] text-white p-4 rounded-full shadow-2xl backdrop-blur-md border border-white/10",
                                "disabled:opacity-20 disabled:cursor-not-allowed",
                                "transition-all active:scale-95"
                            )}
                        >
                            <ChevronLeft className="h-6 w-6 stroke-[3px]" />
                        </button>
                        <button
                            onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                            disabled={currentPage >= numPages - 1}
                            className={cn(
                                "bg-slate-900/60 hover:bg-[#E87154] text-white p-4 rounded-full shadow-2xl backdrop-blur-md border border-white/10",
                                "disabled:opacity-20 disabled:cursor-not-allowed",
                                "transition-all active:scale-95"
                            )}
                        >
                            <ChevronRight className="h-6 w-6 stroke-[3px]" />
                        </button>
                    </div>

                    {/* Page Counter and Sleek progress pill */}
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3">
                        <div className="bg-slate-900/85 backdrop-blur-md text-white px-5 py-2.5 rounded-full text-xs flex items-center gap-4 shadow-2xl border border-white/10">
                            <span className="font-bold tracking-wider text-[11px]">Page {currentPage + 1} of {numPages}</span>
                            
                            {/* Mark Complete Button */}
                            {currentPage >= numPages - 2 && !hasMarkedComplete && onComplete && (
                                <>
                                    <div className="w-[1px] h-4 bg-white/20" />
                                    <Button
                                        onClick={() => {
                                            if (!hasMarkedComplete) {
                                                setHasMarkedComplete(true);
                                                onComplete();
                                            }
                                        }}
                                        size="sm"
                                        className="bg-emerald-500 hover:bg-emerald-600 font-black text-white h-7 px-3.5 rounded-full text-[10px] uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-emerald-500/25"
                                    >
                                        Mark Complete
                                    </Button>
                                </>
                            )}
                        </div>
                        
                        {/* Miniature Progress Bar */}
                        <div className="w-48 bg-white/10 h-1 rounded-full overflow-hidden shadow-inner border border-white/5">
                            <div 
                                className="bg-[#E87154] h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(232,113,84,0.6)]"
                                style={{ width: `${(currentPage / (numPages - 1 || 1)) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
