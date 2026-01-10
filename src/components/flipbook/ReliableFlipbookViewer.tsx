"use client";

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Dynamically import flipbook
const HTMLFlipBook = dynamic(() => import('react-pageflip'), { ssr: false });

interface ReliableFlipbookViewerProps {
    pdfUrl: string;
    onClose: () => void;
    title?: string;
    initialPage?: number;
    onPageChange?: (page: number) => void;
    onComplete?: () => void;
}

export function ReliableFlipbookViewer({ 
    pdfUrl, 
    onClose, 
    title, 
    initialPage = 0, 
    onPageChange, 
    onComplete 
}: ReliableFlipbookViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(initialPage);
    const [pageImages, setPageImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [dimensions, setDimensions] = useState({ width: 600, height: 800 });
    const bookRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hasMarkedCompleteRef = useRef(false);

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
        let isMounted = true;
        
        const loadPDF = async () => {
            try {
                console.log('📖 Loading PDF:', pdfUrl);
                setLoading(true);
                
                // Fetch via proxy
                const proxyUrl = `/api/proxy-pdf?url=${encodeURIComponent(pdfUrl)}`;
                const response = await fetch(proxyUrl);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch PDF: ${response.statusText}`);
                }
                
                const pdfData = await response.arrayBuffer();
                console.log('✅ PDF downloaded:', (pdfData.byteLength / 1024 / 1024).toFixed(2), 'MB');
                
                // Load PDF with PDF.js
                const loadingTask = pdfjsLib.getDocument({ data: pdfData });
                const pdf = await loadingTask.promise;
                
                if (!isMounted) return;
                
                console.log('📄 PDF loaded, pages:', pdf.numPages);
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
                        console.log(`📸 Rendered page ${pageNum}/${pdf.numPages}`);
                    }
                }
                
                if (!isMounted) return;
                
                setPageImages(images);
                setLoading(false);
                console.log('✅ All pages rendered');
                
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
    }, [pdfUrl, initialPage]);

    // Responsive sizing
    useEffect(() => {
        const handleResize = () => {
            const maxWidth = window.innerWidth * 0.45;
            const maxHeight = window.innerHeight * 0.8;
            setDimensions({ width: maxWidth, height: maxHeight });
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") bookRef.current?.pageFlip()?.flipNext();
            if (e.key === "ArrowLeft") bookRef.current?.pageFlip()?.flipPrev();
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const handlePageChange = (pageData: any) => {
        const page = pageData.data || pageData;
        setCurrentPage(page);
        onPageChange?.(page);
        
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
        
        // Mark as complete when reaching the last page (only once)
        if (page >= numPages - 1 && onComplete && !hasMarkedCompleteRef.current) {
            hasMarkedCompleteRef.current = true;
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center">
            {/* Header */}
            <div className="absolute top-4 right-4 z-50">
                <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
                    <X className="h-6 w-6" />
                </Button>
            </div>
            {title && (
                <div className="absolute top-4 left-4 text-white font-medium text-lg z-50">
                    {title}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center gap-4 max-w-md">
                    <Loader2 className="h-12 w-12 animate-spin text-white" />
                    <p className="text-white text-lg">Loading flipbook...</p>
                    <div className="w-64 bg-white/20 rounded-full h-2 overflow-hidden">
                        <div 
                            className="bg-white h-full transition-all duration-300"
                            style={{ width: `${loadingProgress}%` }}
                        />
                    </div>
                    <p className="text-white/70 text-sm">{loadingProgress}% - Rendering pages</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="flex flex-col items-center gap-4 max-w-md text-center">
                    <div className="text-red-500 text-6xl">⚠️</div>
                    <p className="text-white text-lg">{error}</p>
                    <Button onClick={onClose} variant="outline">Close</Button>
                </div>
            )}

            {/* Flipbook */}
            {!loading && !error && pageImages.length > 0 && (
                <div className="flex-1 flex items-center justify-center w-full relative">
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
                        usePortrait={false}
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
                            <div key={index} className="bg-white shadow-2xl flex items-center justify-center">
                                <img 
                                    src={imageUrl} 
                                    alt={`Page ${index + 1}`}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        ))}
                    </HTMLFlipBook>

                    {/* Navigation Controls */}
                    <button
                        onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
                        disabled={currentPage === 0}
                        className={cn(
                            "absolute left-4 top-1/2 -translate-y-1/2 z-50",
                            "bg-white/90 hover:bg-white p-3 rounded-full shadow-lg",
                            "disabled:opacity-30 disabled:cursor-not-allowed",
                            "transition-all hover:scale-110"
                        )}
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={() => bookRef.current?.pageFlip()?.flipNext()}
                        disabled={currentPage >= numPages - 1}
                        className={cn(
                            "absolute right-4 top-1/2 -translate-y-1/2 z-50",
                            "bg-white/90 hover:bg-white p-3 rounded-full shadow-lg",
                            "disabled:opacity-30 disabled:cursor-not-allowed",
                            "transition-all hover:scale-110"
                        )}
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>

                    {/* Page Counter */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/70 text-white px-4 py-2 rounded-full text-sm flex items-center gap-3">
                        <span>Page {currentPage + 1} of {numPages}</span>
                        
                        {/* Mark Complete Button when on last page */}
                        {currentPage >= numPages - 1 && !hasMarkedCompleteRef.current && onComplete && (
                            <Button
                                onClick={() => {
                                    if (!hasMarkedCompleteRef.current) {
                                        hasMarkedCompleteRef.current = true;
                                        onComplete();
                                    }
                                }}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white h-7 px-3 text-xs"
                            >
                                Mark Complete
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
