"use client";

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimpleFlipbookViewerProps {
    pdfUrl: string;
    onClose: () => void;
    title?: string;
}

export function SimpleFlipbookViewer({ pdfUrl, onClose, title }: SimpleFlipbookViewerProps) {
    // Use proxy for better performance
    const proxyUrl = `/api/proxy-pdf?url=${encodeURIComponent(pdfUrl)}`;
    
    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm border-b border-white/10">
                <h2 className="text-white font-medium text-lg">
                    {title || 'Flipbook Viewer'}
                </h2>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onClose} 
                    className="text-white hover:bg-white/20"
                >
                    <X className="h-6 w-6" />
                </Button>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 relative">
                <iframe
                    src={`${proxyUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                    className="absolute inset-0 w-full h-full"
                    title={title || 'PDF Viewer'}
                    style={{ border: 'none' }}
                />
            </div>

            {/* Instructions */}
            <div className="p-2 bg-black/50 backdrop-blur-sm border-t border-white/10 text-center text-xs text-white/70">
                Use browser PDF controls to navigate • Press ESC or click X to close
            </div>
        </div>
    );
}
