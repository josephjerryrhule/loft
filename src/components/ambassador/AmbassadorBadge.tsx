"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface AmbassadorBadgeProps {
  user: {
    firstName: string | null;
    lastName: string | null;
    role: string;
    ambassadorId: string | null;
    profilePictureUrl: string | null;
    status: string;
    ambassadorExpiry: Date | null;
  };
  logoUrl?: string;
}

export function AmbassadorBadge({ user, logoUrl }: AmbassadorBadgeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const brandColor = "#E87154";
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  const isExpired = user.ambassadorExpiry ? new Date() > new Date(user.ambassadorExpiry) : false;
  const isActive = user.status === "ACTIVE" && !isExpired;
  const roleName = user.role === "MANAGER" ? "Loft Manager" : "Loft Affiliate";

  useEffect(() => {
    if (user.ambassadorId) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const verifyUrl = `${baseUrl}/verify/${user.ambassadorId}`;
      QRCode.toDataURL(verifyUrl, {
        width: 256,
        margin: 1,
        color: {
          dark: "#0f172a", // slate-900
          light: "#ffffff",
        },
      }, (err, url) => {
        if (!err) setQrCodeUrl(url);
      });
    }
  }, [user.ambassadorId]);

  return (
    <div id="ambassador-badge" className="w-[350px] bg-white border shadow-2xl rounded-2xl overflow-hidden font-sans mx-auto relative group">
      {/* Brand Header - Reduced Padding */}
      <div className="bg-[#FFFAF5] p-5 flex flex-col items-center border-b">
        <div className="relative w-28 h-8 mb-1.5">
            <Image 
                src={logoUrl || "/logo.png"} 
                alt="Logo" 
                fill 
                className="object-contain" 
            />
        </div>
        <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-[#E87154]" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Official Representative</span>
        </div>
      </div>

      {/* Main Body - Optimized Spacing */}
      <div className="p-6 flex flex-col items-center text-center">
        {/* Photo Area - Slightly Smaller */}
        <div className="relative mb-5">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#FFFAF5] shadow-xl bg-slate-50 flex items-center justify-center">
            {user.profilePictureUrl ? (
              <Image 
                src={user.profilePictureUrl} 
                alt={fullName} 
                fill 
                className="object-cover"
              />
            ) : (
              <User className="w-14 h-14 text-slate-200" />
            )}
          </div>
          {/* Status Overlay Icon */}
          <div className="absolute bottom-0 right-0">
             {isActive ? (
                <div className="bg-[#E87154] text-white p-1.5 rounded-full border-4 border-white shadow-lg">
                    <CheckCircle2 className="w-5 h-5" />
                </div>
             ) : (
                <div className="bg-slate-400 text-white p-1.5 rounded-full border-4 border-white shadow-lg">
                    <XCircle className="w-5 h-5" />
                </div>
             )}
          </div>
        </div>

        {/* Info - Tightened */}
        <div className="space-y-0.5 mb-6">
            <h2 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">{fullName}</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: brandColor }}>{roleName}</p>
        </div>

        {/* Verification Strip - Integrated QR Code & Compact Info */}
        <div className="w-full bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-4">
            {/* QR Code */}
            <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm shrink-0">
                {qrCodeUrl ? (
                    <Image src={qrCodeUrl} alt="QR Code" width={70} height={70} className="rounded-sm" />
                ) : (
                    <div className="w-[70px] h-[70px] bg-slate-100 animate-pulse rounded-sm" />
                )}
            </div>

            {/* ID Details */}
            <div className="flex-1 flex flex-col gap-1.5 text-left">
                <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Ambassador ID</span>
                    <span className="text-sm font-mono font-black text-slate-900 tracking-tight">{user.ambassadorId || "PENDING"}</span>
                </div>
                <div className="h-px bg-slate-200/50 w-full" />
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Status</span>
                        {isActive ? (
                            <span className="text-[9px] font-black text-[#E87154] uppercase italic">Active</span>
                        ) : (
                           <span className="text-[9px] font-black text-slate-400 uppercase italic">Inactive</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Valid Until</span>
                        <span className="text-[9px] font-black text-slate-900 uppercase">
                            {user.ambassadorExpiry ? format(new Date(user.ambassadorExpiry), "MMM yyyy") : "Indefinite"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Footer / QR Hint */}
      <div className="bg-slate-900 p-3 text-center">
        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em]">
            Scan official QR for live verification
        </p>
      </div>

      {/* Security Watermark (Subtle) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none">
          <ShieldCheck className="w-64 h-64" />
      </div>
    </div>
  );
}
