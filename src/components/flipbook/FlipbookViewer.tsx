"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import HTMLFlipBook from 'react-pageflip';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FlipbookViewerProps {
    pdfUrl: string;
    onClose: () => void;
    title?: string;
}

export function FlipbookViewer({ pdfUrl, onClose, title }: FlipbookViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState(0); // 0-indexed for internal logic if needed, or spread pages
    const bookRef = useRef<any>(null);
    const [loading, setLoading] = useState(true);
    const [dimensions, setDimensions] = useState({ width: 400, height: 550 });

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setLoading(false);
    }

    const nextFlip = () => {
        bookRef.current?.pageFlip()?.flipNext();
    };

    const prevFlip = () => {
        bookRef.current?.pageFlip()?.flipPrev();
    };
    
    // Responsive sizing roughly
    useEffect(() => {
        const handleResize = () => {
             const width = Math.min(window.innerWidth * 0.4, 600);
             const height = width * 1.414; // A4 Aspect Ratio roughly
             setDimensions({ width, height });
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
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
            <div className="relative flex items-center justify-center w-full h-full max-w-7xl">
                {/* Controls */}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute left-4 z-50 text-white hover:bg-white/10 hidden md:flex" 
                    onClick={prevFlip}
                >
                    <ChevronLeft className="h-10 w-10" />
                </Button>

                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-4 z-50 text-white hover:bg-white/10 hidden md:flex" 
                    onClick={nextFlip}
                >
                    <ChevronRight className="h-10 w-10" />
                </Button>

                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                        <Loader2 className="h-10 w-10 animate-spin" />
                    </div>
                )}

                <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="text-white">Loading PDF...</div>}
                    className="flex justify-center"
                >
                    {numPages > 0 && (
                         // @ts-ignore - types for react-pageflip can be tricky
                        <HTMLFlipBook 
                            width={dimensions.width} 
                            height={dimensions.height} 
                            ref={bookRef}
                            showCover={true}
                            className={cn("demo-book")}
                            style={{}}
                            startPage={0}
                            size="fixed"
                            minWidth={300}
                            maxWidth={1000}
                            minHeight={400}
                            maxHeight={1500}
                            drawShadow={true}
                            flippingTime={1000}
                            usePortrait={true}
                            startZIndex={0}
                            autoSize={true}
                            maxShadowOpacity={0.5}
                            mobileScrollSupport={true}
                            clickEventForward={true}
                            useMouseEvents={true}
                            swipeDistance={30}
                            showPageCorners={true}
                            disableFlipByClick={false}
                        >
                            {[...Array(numPages)].map((_, index) => (
                                <div key={index} className="bg-white shadow-lg overflow-hidden flex items-center justify-center">
                                    <Page 
                                        pageNumber={index + 1} 
                                        width={dimensions.width} 
                                        renderAnnotationLayer={false}
                                        renderTextLayer={false}
                                    />
                                </div>
                            ))}
                        </HTMLFlipBook>
                    )}
                </Document>
            </div>
            
            {/* Footer / Status */}
             {!loading && (
                 <div className="absolute bottom-4 text-white/50 text-sm">
                     Use arrow keys or click corners to turn pages
                 </div>
             )}
        </div>
    );
}
