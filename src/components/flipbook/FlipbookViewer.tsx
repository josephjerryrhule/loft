"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Set PDF worker to local file
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

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
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [dimensions, setDimensions] = useState({ width: 800, height: 565 }); // Landscape init
    const [aspectRatio, setAspectRatio] = useState(1.414); // Default A4 Landscape (297/210)
    const [renderRange, setRenderRange] = useState(4); // How many pages to pre-render around current page
    const [pdfBlob, setPdfBlob] = useState<string | null>(null);
    
    // Track document load start
    useEffect(() => {
        console.log('📖 FlipbookViewer mounted. PDF URL:', pdfUrl);
        setLoading(true);
        setPdfBlob(null);
        
        let isMounted = true;
        const abortController = new AbortController();
        
        // Fetch PDF via proxy to avoid browser CORS/timeout issues
        const fetchPdfBlob = async () => {
            try {
                // Use API proxy for Supabase URLs
                const proxyUrl = `/api/proxy-pdf?url=${encodeURIComponent(pdfUrl)}`;
                console.log('🔍 Fetching PDF via proxy...');
                
                // Create a timeout promise  
                const timeout = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Fetch timeout after 30 seconds')), 30000)
                );
                
                // Race between fetch and timeout
                const response = await Promise.race([
                    fetch(proxyUrl, { 
                        signal: abortController.signal,
                    }),
                    timeout
                ]) as Response;
                
                console.log('📡 Proxy response received:', {
                    status: response.status,
                    statusText: response.statusText,
                    contentType: response.headers.get('content-type'),
                    contentLength: response.headers.get('content-length')
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
                }
                
                console.log('📥 Reading blob data...');
                const blob = await response.blob();
                
                if (!isMounted) {
                    console.log('⚠️ Component unmounted, skipping blob URL creation');
                    return;
                }
                
                const blobUrl = URL.createObjectURL(blob);
                console.log('✅ PDF blob created:', {
                    size: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
                    type: blob.type,
                    blobUrl: blobUrl.substring(0, 50) + '...'
                });
                setPdfBlob(blobUrl);
            } catch (err: any) {
                if (!isMounted) return;
                
                console.error('❌ Failed to fetch PDF:', err);
                if (err.name === 'AbortError') {
                    console.log('⚠️ Fetch was aborted (component unmounted)');
                } else {
                    setError(`Cannot load PDF: ${err.message}`);
                    setLoading(false);
                }
            }
        };
        
        fetchPdfBlob();
        
        return () => {
            console.log('🧹 Cleaning up FlipbookViewer');
            isMounted = false;
            abortController.abort();
            if (pdfBlob) {
                URL.revokeObjectURL(pdfBlob);
            }
        };
    }, [pdfUrl]);

    // Memoize PDF.js options
    const pdfOptions = useMemo(() => ({
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
        withCredentials: false,
        isEvalSupported: false,
        // Try to force CORS mode
        httpHeaders: {
            'Accept': 'application/pdf',
        },
    }), []);

    function onDocumentLoadProgress({ loaded, total }: { loaded: number; total: number }) {
        const progress = Math.round((loaded / total) * 100);
        setLoadingProgress(progress);
        console.log(`📥 Loading PDF: ${progress}% (${(loaded / 1024 / 1024).toFixed(2)}MB / ${(total / 1024 / 1024).toFixed(2)}MB)`);
    }

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        console.log('✅ PDF loaded successfully with', numPages, 'pages');
        setNumPages(numPages);
        setLoading(false);
        setLoadingProgress(100);
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
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        setError(`Failed to load PDF: ${error.message}. Click "Open in New Tab" to view directly.`);
        setLoading(false);
    }

    function onDocumentLoadStart() {
        console.log('⏳ Starting to load PDF document...');
    }

    function onSourceError(error: Error) {
        console.error('❌ Source error:', error);
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
                console.error('⏱️ PDF loading timeout after 60 seconds');
                setError(`Document loading timeout at ${loadingProgress}%. Please try again or check your internet connection.`);
                setLoading(false);
            }
        }, 60000); // 60 second timeout

        return () => clearTimeout(timeout);
    }, [loading, error, loadingProgress]);

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
             <div className="absolute top-4 right-4 z-50 flex gap-2">
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
                    {loadingProgress > 0 ? (
                        <>
                            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                                <div 
                                    className="bg-white h-full transition-all duration-300"
                                    style={{ width: `${loadingProgress}%` }}
                                />
                            </div>
                            <p className="text-white/70 text-sm">{loadingProgress}% complete</p>
                        </>
                    ) : (
                        <p className="text-white/50 text-xs">Connecting to PDF source...</p>
                    )}
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="flex flex-col items-center gap-4 max-w-md text-center">
                    <div className="text-red-500 text-6xl">⚠️</div>
                    <p className="text-white text-lg">{error}</p>
                    <div className="flex gap-2">
                        <Button onClick={onClose} variant="outline">Close</Button>
                        <Button 
                            onClick={() => window.open(pdfUrl, '_blank')}
                            variant="default"
                        >
                            Open in New Tab
                        </Button>
                    </div>
                    <p className="text-white/70 text-sm mt-2">
                        Or try the <button 
                            onClick={() => {
                                // Reload page and use iframe directly
                                const iframe = document.createElement('div');
                                iframe.innerHTML = `
                                    <div class="fixed inset-0 z-50 bg-black/95 flex flex-col">
                                        <div class="absolute top-4 right-4 z-50">
                                            <button onclick="this.closest('div').parentElement.remove()" class="text-white hover:bg-white/20 p-2 rounded">
                                                ✕
                                            </button>
                                        </div>
                                        <iframe src="${pdfUrl}" class="w-full h-full" title="PDF Viewer"></iframe>
                                    </div>
                                `;
                                document.body.appendChild(iframe.firstElementChild!);
                            }}
                            className="text-blue-400 underline hover:text-blue-300"
                        >
                            simple browser viewer
                        </button>
                    </p>
                </div>
            )}

            {/* Flipbook Viewer */}
            {!loading && !error && pdfBlob && (
                <div className="flex-1 flex items-center justify-center w-full relative">
                    <Document
                        file={pdfBlob}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        onLoadProgress={onDocumentLoadProgress}
                        onSourceError={onSourceError}
                        loading={null}
                        options={pdfOptions}
                    >
                        <div className="relative">
                            <HTMLFlipBook
                                ref={bookRef}
                                width={dimensions.width}
                                height={dimensions.height}
                                size="stretch"
                                minWidth={300}
                                maxWidth={1200}
                                minHeight={400}
                                maxHeight={1533}
                                drawShadow={true}
                                flippingTime={600}
                                usePortrait={aspectRatio < 1}
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
                                {Array.from(new Array(numPages), (_, index) => {
                                    // Only render pages within range of current page for better performance
                                    const shouldRender = Math.abs(index - currentPage) <= renderRange;
                                    
                                    return (
                                        <div key={`page_${index + 1}`} className="bg-white shadow-2xl">
                                            {shouldRender ? (
                                                <Page
                                                    pageNumber={index + 1}
                                                    width={dimensions.width}
                                                    renderTextLayer={false}
                                                    renderAnnotationLayer={false}
                                                    loading={<div className="flex items-center justify-center h-full bg-gray-100"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>}
                                                    onLoadSuccess={index === 0 ? onPageLoadSuccess : undefined}
                                                />
                                            ) : (
                                                <div 
                                                    className="flex items-center justify-center h-full bg-gray-50"
                                                    style={{ width: dimensions.width, height: dimensions.height }}
                                                >
                                                    <p className="text-gray-400 text-sm">Page {index + 1}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </HTMLFlipBook>
                        </div>
                    </Document>

                    {/* Navigation Controls */}
                    {numPages > 0 && (
                        <>
                            <button
                                onClick={prevFlip}
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
                                onClick={nextFlip}
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
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                                Page {currentPage + 1} of {numPages}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
