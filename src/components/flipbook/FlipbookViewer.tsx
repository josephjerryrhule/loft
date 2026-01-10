"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Set PDF worker before any PDF operations
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Only lazy load the flipbook library (PDF.js needs to be loaded synchronously)
const HTMLFlipBook = dynamic(() => import('react-pageflip'), { ssr: false });

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
    const [error, setError] = useState<string | null>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 565 }); // Landscape init
    const [aspectRatio, setAspectRatio] = useState(1.414); // Default A4 Landscape (297/210)

    // Log component mount and PDF URL
    useEffect(() => {
        console.log('FlipbookViewer mounted with URL:', pdfUrl);
        console.log('PDF.js worker source:', pdfjs.GlobalWorkerOptions.workerSrc);
        return () => console.log('FlipbookViewer unmounted');
    }, [pdfUrl]);

    // Memoize PDF.js options to prevent unnecessary reloads
    const pdfOptions = useMemo(() => ({
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
    }), []);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        console.log('✅ PDF loaded successfully with', numPages, 'pages');
        setNumPages(numPages);
        setLoading(false);
        setError(null);
        
        // Jump to initial page after load
        if (initialPage > 0) {
            setTimeout(() => {
                bookRef.current?.pageFlip()?.turnToPage(initialPage);
            }, 500);
        }
    }

    function onDocumentLoadError(error: Error) {
        console.error('❌ Error loading PDF:', error);
        setError(error.message || 'Failed to load document');
        setLoading(false);
    }

    function onDocumentLoadStart() {
        console.log('⏳ Starting to load PDF...');
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
             if (Math.abs(ratio - aspectRatio) > 0.1) {
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

    // Add timeout for loading
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (loading && !error) {
                console.error('⏱️ PDF loading timeout after 30 seconds');
                setError('Document loading timeout. The PDF might be too large or the URL is invalid.');
                setLoading(false);
            }
        }, 30000); // 30 second timeout

        return () => clearTimeout(timeout);
    }, [loading, error]);

    // Responsive sizing
    useEffect(() => {
        const handleResize = () => {
             // We want the *spread* (2 pages) to fit in the container.
             // Available space:
             const maxWidth = window.innerWidth * 0.95; 
             const maxHeight = window.innerHeight * 0.9;
             
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
    }, [aspectRatio]);

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

                {loading && !error && (
                    <div className="absolute inset-0 flex items-center justify-center text-white z-50">
                        <Loader2 className="h-10 w-10 animate-spin mr-2" />
                        <span>Loading Document...</span>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-50 p-8 text-center">
                        <X className="h-16 w-16 text-red-500 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Failed to Load Document</h3>
                        <p className="text-white/70 mb-4">{error}</p>
                        <Button onClick={onClose} variant="outline">Close</Button>
                    </div>
                )}

                <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    onLoadProgress={(progress) => {
                        if (progress.loaded && progress.total) {
                            const percent = Math.round((progress.loaded / progress.total) * 100);
                            console.log(`📥 Loading PDF: ${percent}%`);
                        }
                    }}
                    onSourceSuccess={() => console.log('✅ PDF source loaded successfully')}
                    loading={null}
                    className="flex justify-center items-center"
                    options={pdfOptions}
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
                                        loading={null}
                                        className="h-full w-full"
                                        scale={1.0}
                                    />
                                </div>
                            ))}
                        </HTMLFlipBook>
                    )}
                </Document>
            </div>
        </div>
    );
}
