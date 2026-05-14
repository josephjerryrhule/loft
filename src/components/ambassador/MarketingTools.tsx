"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Printer, Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { AmbassadorBadge } from "./AmbassadorBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MarketingToolsProps {
  user: any;
  logoUrl?: string;
}

export function MarketingTools({ user, logoUrl }: MarketingToolsProps) {
  const [downloadingQR, setDownloadingQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const downloadQRCode = async () => {
    try {
      setDownloadingQR(true);
      const response = await fetch(`/api/generate-qr?userId=${user.id}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate QR code");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `${user.role.toLowerCase()}-${user.firstName || "user"}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("QR code downloaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to download QR code");
    } finally {
      setDownloadingQR(false);
    }
  };

  const handlePrintBadge = () => {
    const badgeElement = document.getElementById('ambassador-badge');
    if (!badgeElement) return;

    // Create a clone of the badge to manipulate it for printing
    const badgeClone = badgeElement.cloneNode(true) as HTMLElement;
    
    // Make all image URLs absolute
    const images = badgeClone.getElementsByTagName('img');
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img.src && img.src.startsWith('/')) {
        img.src = window.location.origin + img.src;
      }
      if (img.srcset) {
        img.srcset = img.srcset.split(',').map(s => {
          const parts = s.trim().split(' ');
          if (parts[0].startsWith('/')) {
            parts[0] = window.location.origin + parts[0];
          }
          return parts.join(' ');
        }).join(', ');
      }
      // Remove lazy loading for print
      img.removeAttribute('loading');
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get all style tags and link tags from current document to preserve styles
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('\n');

    // Build print-specific HTML
    const html = `
      <html>
        <head>
          <title>Ambassador ID Badge - ${user.firstName}</title>
          ${styles}
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { 
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background-color: #f8fafc !important;
              }
              #ambassador-badge { 
                box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) !important;
                border: 1px solid #e2e8f0 !important;
                border-radius: 1rem !important;
                overflow: hidden !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                width: 350px !important;
                margin: auto !important;
              }
              /* Force backgrounds to show */
              .bg-[#FFFAF5] { background-color: #FFFAF5 !important; }
              .bg-slate-900 { background-color: #0f172a !important; }
              .bg-slate-50 { background-color: #f8fafc !important; }
              .bg-white { background-color: #ffffff !important; }
              .bg-[#E87154] { background-color: #E87154 !important; }
              .text-[#E87154] { color: #E87154 !important; }
              
              /* Ensure the watermark is visible but subtle */
              .opacity-\\[0\\.03\\] { opacity: 0.05 !important; }
            }
          </style>
        </head>
        <body class="bg-slate-50">
          <div class="p-8 flex justify-center items-center min-h-screen">
            ${badgeClone.outerHTML}
          </div>
          <script>
            // Function to check if all images are loaded
            function allImagesLoaded() {
              const images = document.getElementsByTagName('img');
              for (let i = 0; i < images.length; i++) {
                if (!images[i].complete) return false;
              }
              return true;
            }

            window.onload = () => {
              const checkLoaded = setInterval(() => {
                if (allImagesLoaded()) {
                  clearInterval(checkLoaded);
                  window.print();
                  setTimeout(() => window.close(), 500);
                }
              }, 100);
              
              // Fallback after 3 seconds
              setTimeout(() => {
                clearInterval(checkLoaded);
                window.print();
                setTimeout(() => window.close(), 500);
              }, 3000);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const copyVerifyLink = () => {
    const baseUrl = window.location.origin;
    const verifyUrl = `${baseUrl}/verify/${user.ambassadorId}`;
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    toast.success("Verification link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Your Verification QR</CardTitle>
            <CardDescription>
              Scan this QR code to instantly verify your LOFT Ambassador status. 
              Present this to potential recruits and customers.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center space-y-4 py-8">
             <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <QrCode size={160} className="text-slate-300" />
             </div>
             <div className="flex gap-2 w-full">
                <Button onClick={downloadQRCode} disabled={downloadingQR} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download PNG
                </Button>
                <Button variant="outline" onClick={copyVerifyLink}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
             </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Marketing Support</CardTitle>
            <CardDescription>
              Resources to help you represent LOFT professionally.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
             <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm font-medium">
                💡 Tip: Use your ID Badge when visiting schools or potential partners to establish trust immediately.
             </div>
             <div className="space-y-2">
                <Button className="w-full justify-start h-12" variant="outline" onClick={handlePrintBadge}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print ID Badge
                </Button>
                <Button className="w-full justify-start h-12" variant="outline" onClick={copyVerifyLink}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Verification Link
                </Button>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <h3 className="text-lg font-bold mb-4 px-1">ID Badge Preview</h3>
        <div className="bg-slate-50 p-12 rounded-2xl border border-dashed border-slate-200 flex justify-center overflow-auto">
            <AmbassadorBadge user={user} logoUrl={logoUrl} />
        </div>
      </div>
    </div>
  );
}
