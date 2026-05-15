import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ShieldAlert, Clock, User, Mail, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { verificationRateLimit } from "@/lib/ratelimit";
import { headers } from "next/headers";
import { getSystemSettings } from "@/app/actions/settings";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface VerifyPageProps {
  params: Promise<{
    ambassadorId: string;
  }>;
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { ambassadorId } = await params;
  
  // Rate limiting
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "anonymous";
  const { success: rateLimitSuccess } = await verificationRateLimit.limit(ip);

  if (!rateLimitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFFAF5]">
        <Card className="w-full max-w-md border-orange-200">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="w-12 h-12 text-orange-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-orange-600">TOO MANY REQUESTS</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-600">
              You have made too many verification requests in a short period.
            </p>
            <p className="text-sm text-slate-500">
              Please wait a moment before trying again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [user, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { ambassadorId },
      select: {
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        ambassadorId: true,
        ambassadorExpiry: true,
        profilePictureUrl: true,
        inviteCode: true,
        email: true,
        updatedAt: true,
      },
    }),
    getSystemSettings()
  ]);

  const logoUrl = settings.logoUrl || "/logo.png";
  const brandColor = "#E87154";

  if (!user || (user.role !== "MANAGER" && user.role !== "AFFILIATE")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFFAF5]">
        <Card className="w-full max-w-md border-slate-200 shadow-none">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-slate-100 rounded-full">
                <ShieldAlert className="w-12 h-12 text-slate-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 uppercase tracking-tight">NOT AUTHORIZED</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-600">
              The ambassador ID <span className="font-mono font-bold text-slate-900">{ambassadorId}</span> could not be verified in our system.
            </p>
            <div className="pt-4">
              <Button asChild variant="outline" className="w-full border-slate-200 hover:bg-slate-50">
                <Link href="/">Return to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = user.ambassadorExpiry ? new Date() > user.ambassadorExpiry : false;
  const isActive = user.status === "ACTIVE" && !isExpired;
  
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  const roleName = user.role === "MANAGER" ? "Loft Manager" : "Loft Affiliate";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#FFFAF5]">
      <div className="mb-8 flex flex-col items-center">
        <div className="relative w-40 h-16 mb-4">
          <Image 
            src={logoUrl} 
            alt="Platform Logo" 
            fill 
            className="object-contain" 
            priority
          />
        </div>
        <h1 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Official Verification</h1>
      </div>

      <Card className="w-full max-w-md border-slate-100 shadow-sm overflow-hidden rounded-xl">
        <CardHeader className="pb-2 pt-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-slate-50 flex items-center justify-center shadow-md">
                {user.profilePictureUrl ? (
                  <Image 
                    src={user.profilePictureUrl} 
                    alt={fullName} 
                    fill 
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-slate-200" />
                )}
              </div>
              <div className="absolute -bottom-2 right-0">
                {isActive ? (
                  <div className="bg-[#E87154] text-white p-1.5 rounded-full border-4 border-white shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="bg-slate-400 text-white p-1.5 rounded-full border-4 border-white shadow-sm">
                    <XCircle className="w-6 h-6" />
                  </div>
                ) }
              </div>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{fullName}</h2>
            <p className="font-semibold uppercase tracking-wider text-[10px] mt-1" style={{ color: brandColor }}>{roleName}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {/* Status Badge */}
          <div className="flex justify-center">
            {isActive ? (
              <Badge className="bg-[#E87154] text-white hover:bg-[#E87154] border-none px-6 py-2 text-xs font-black tracking-widest flex gap-2 items-center rounded-full">
                VERIFIED ACTIVE
              </Badge>
            ) : (
              <Badge className="bg-slate-900 text-white hover:bg-slate-900 border-none px-6 py-2 text-xs font-black tracking-widest flex gap-2 items-center rounded-full">
                NOT AUTHORIZED
              </Badge>
            )}
          </div>
{/* Details Grid */}
<div className="grid grid-cols-1 gap-4 bg-slate-50/50 p-6 rounded-xl border border-slate-100">
  <div className="flex justify-between items-center">
    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter">Ambassador ID</span>
    <span className="font-mono font-bold text-slate-900 text-sm">{user.ambassadorId}</span>
  </div>

  <div className="flex justify-between items-center border-t border-slate-100 pt-4">
    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter">
      {isActive ? 'Valid Until' : 'Expired On'}
    </span>
    <span className="font-bold text-slate-900 text-sm">
      {/* If deactivated, show the date it was last updated (deactivation date) or expiry date */}
      {!isActive 
        ? (user.ambassadorExpiry && isExpired 
            ? format(new Date(user.ambassadorExpiry), "MMM dd, yyyy") 
            : format(new Date(user.updatedAt), "MMM dd, yyyy"))
        : (user.ambassadorExpiry 
            ? format(new Date(user.ambassadorExpiry), "MMM dd, yyyy") 
            : 'Indefinite')}
    </span>
  </div>
</div>


          {/* Verification Timestamp */}
          <div className="text-center space-y-1 py-2">
            <p className="text-[9px] uppercase font-black text-slate-300 tracking-[0.3em]">
              Verified At
            </p>
            <p className="text-slate-900 text-xs font-bold">
              {format(new Date(), "MMM dd, yyyy · HH:mm:ss")}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-2">
            {isActive && user.role === "AFFILIATE" && (
              <Button asChild className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg h-12 font-bold text-xs uppercase tracking-widest rounded-xl transition-all">
                <Link href={`/join/customer/${user.inviteCode}`}>
                  Join as Customer
                  <ExternalLink className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            )}
            {isActive && user.role === "MANAGER" && (
              <Button asChild className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg h-12 font-bold text-xs uppercase tracking-widest rounded-xl transition-all">
                <Link href={`/join/affiliate/${user.inviteCode}`}>
                  Join as Affiliate
                  <ExternalLink className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            )}
            
            <a 
              href={`mailto:support@landoffairytales.com?subject=Suspicious%20Ambassador%20Report:%20${ambassadorId}&body=I%20would%20like%20to%20report%20suspicious%20activity%20regarding%20ambassador%20${ambassadorId}%20(${fullName}).`}
              className="block text-center text-[10px] text-slate-300 hover:text-[#E87154] transition-colors font-bold uppercase tracking-widest mt-4"
            >
              Report suspicious activity
            </a>
          </div>
        </CardContent>
      </Card>
      
      <p className="mt-8 text-slate-300 text-[10px] text-center max-w-[240px] font-bold leading-relaxed uppercase tracking-tighter">
        Official authorized verification page. All rights reserved.
      </p>
    </div>
  );
}
