"use client";

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Lazy load heavy PDF libraries
const Document = dynamic(() => import('react-pdf').then(mod => mod.Document), { ssr: false });
const Page = dynamic(() => import('react-pdf').then(mod => mod.Page), { ssr: false });
const HTMLFlipBook = dynamic(() => import('react-pageflip'), { ssr: false });

// Dynamically set PDF worker
if (typeof window !== 'undefined') {
  import('react-pdf').then((pdfjs) => {
    pdfjs.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.pdfjs.version}/build/pdf.worker.min.mjs`;
  });
}

interface FlipbookViewerProps {
    pdfUrl: string;
    onClose: () => void;
    title?: string;
    initialPage?: number;
    onPageChange?: (page: number) => void;
    onComplete?: () => void;
}


export function FlipbookViewer({ pdfUrl, onClose, title, initialPage = 0, onPageChange, onComplete }: FlipbookViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(initialPage);
    const bookRef = useRef<any>(null);
    const [loading, setLoading] = useState(true);
    const [dimensions, setDimensions] = useState({ width: 800, height: 450 }); // 16:9 init
    const [aspectRatio, setAspectRatio] = useState(0.7071); // Default A4
    const [thumbsVisible, setThumbsVisible] = useState(true);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setLoading(false);
        
        // Jump to initial page after load
        if (initialPage > 0) {
            setTimeout(() => {
                bookRef.current?.pageFlip()?.turnToPage(initialPage);
            }, 500);
        }
    }
    
    function handlePageChange(pageData: any) {
        const page = pageData.data || pageData;
        setCurrentPage(page);
        onPageChange?.(page);
        
        // Check if completed (reached last page)
        if (page >= numPages - 1 && onComplete) {
            onComplete();
        }
    }
    
    // Capture aspect ratio from the first page
    function onPageLoadSuccess(page: any) {
        if (page.originalWidth && page.originalHeight) {
             const ratio = page.originalWidth / page.originalHeight;
             // Only update if significantly different to avoid loops
             if (Math.abs(ratio - aspectRatio) > 0.01) {
                 setAspectRatio(ratio);
             }
        }
    }

    const nextFlip = () => {
        bookRef.current?.pageFlip()?.flipNext();
    };

    const prevFlip = () => {
        bookRef.current?.pageFlip()?.flipPrev();
    };

    const goToPage = (index: number) => {
         bookRef.current?.pageFlip()?.turnToPage(index);
    };
    
    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") nextFlip();
            if (e.key === "ArrowLeft") prevFlip();
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    // Responsive sizing
    useEffect(() => {
        const handleResize = () => {
             // We want the *spread* (2 pages) to fit in the container.
             // Available space:
             const maxWidth = window.innerWidth * 0.95; 
             const maxHeight = window.innerHeight * (thumbsVisible ? 0.75 : 0.9); // Reserve space for thumbs
             
             // Calculate max dimensions for a single page based on aspect ratio
             // Constraint 1: Height
             let pageHeight = maxHeight;
             let pageWidth = pageHeight * aspectRatio;
             
             // Check Constraint 2: Width (Spread = 2 * pageWidth)
             if (pageWidth * 2 > maxWidth) {
                 pageWidth = maxWidth / 2;
                 pageHeight = pageWidth / aspectRatio;
             }
             
             setDimensions({ width: pageWidth, height: pageHeight });
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [aspectRatio, thumbsVisible]);

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center">
             {/* Header */}
             <div className="absolute top-4 right-4 z-50 flex gap-2">
                 <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => setThumbsVisible(!thumbsVisible)}>
                    {thumbsVisible ? "Hide Thumbs" : "Show Thumbs"}
                 </Button>
                 <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
                     <X className="h-6 w-6" />
                 </Button>
             </div>
             {title && (
                 <div className="absolute top-4 left-4 text-white font-medium text-lg z-50">
                     {title}
                 </div>
             )}

            {/* Viewer */}
            <div className="flex-1 flex items-center justify-center w-full relative overflow-hidden p-4">
                {/* Controls */}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute left-4 z-40 text-white hover:bg-white/10 hidden md:flex h-12 w-12 rounded-full border border-white/10 bg-black/20 backdrop-blur-sm" 
                    onClick={prevFlip}
                >
                    <ChevronLeft className="h-8 w-8" />
                </Button>

                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-4 z-40 text-white hover:bg-white/10 hidden md:flex h-12 w-12 rounded-full border border-white/10 bg-black/20 backdrop-blur-sm" 
                    onClick={nextFlip}
                >
                    <ChevronRight className="h-8 w-8" />
                </Button>

                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center text-white z-50">
                        <Loader2 className="h-10 w-10 animate-spin mr-2" />
                        <span>Loading Document...</span>
                    </div>
                )}

                <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={null}
                    className="flex justify-center items-center"
                >
                    {numPages > 0 && (
                         // @ts-ignore
                        <HTMLFlipBook 
                            width={dimensions.width} 
                            height={dimensions.height} 
                            ref={bookRef}
                            showCover={true}
                            className="shadow-2xl"
                            startPage={initialPage || 0}
                            size="fixed"
                            minWidth={100}
                            maxWidth={2000}
                            minHeight={100}
                            maxHeight={2000}
                            drawShadow={true}
                            flippingTime={800}
                            usePortrait={false} 
                            startZIndex={0}
                            autoSize={true}
                            maxShadowOpacity={0.5}
                            mobileScrollSupport={true}
                            clickEventForward={true}
                            useMouseEvents={true}
                            swipeDistance={30}
                            showPageCorners={true}
                            disableFlipByClick={false}
                            onFlip={handlePageChange}
                        >
                            {[...Array(numPages)].map((_, index) => (
                                <div key={index} className="bg-white overflow-hidden flex items-center justify-center shadow-inner">
                                    <Page 
                                        pageNumber={index + 1} 
                                        width={dimensions.width} 
                                        height={dimensions.height}
                                        onLoadSuccess={index === 0 ? onPageLoadSuccess : undefined}
                                        renderAnnotationLayer={false}
                                        renderTextLayer={false}
                                        className="h-full w-full" 
                                    />
                                </div>
                            ))}
                        </HTMLFlipBook>
                    )}
                </Document>
            </div>
            
            {/* Thumbnails Strip */}
             {!loading && thumbsVisible && (
                 <div className="h-32 w-full bg-black/90 border-t border-white/10 flex items-center gap-4 overflow-x-auto p-4 z-50 backdrop-blur-sm bg-gradient-to-t from-black to-transparent">
                     <Document file={pdfUrl} className="flex gap-4 px-4">
                        {[...Array(numPages)].map((_, index) => (
                            <div 
                                key={`thumb-${index}`} 
                                className="cursor-pointer hover:scale-105 transition-all opacity-70 hover:opacity-100 flex flex-col items-center"
                                onClick={() => goToPage(index)}
                            >
                                <div className="border border-white/20 rounded overflow-hidden">
                                    <Page 
                                        pageNumber={index + 1} 
                                        width={80} 
                                        renderAnnotationLayer={false}
                                        renderTextLayer={false}
                                    />
                                </div>
                                <span className="text-[10px] text-white/70 mt-1">{index + 1}</span>
                            </div>
                        ))}
                     </Document>
                 </div>
             )}
        </div>
    );
}
