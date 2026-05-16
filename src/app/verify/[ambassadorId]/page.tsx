import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ShieldAlert, Clock, User, Mail, ExternalLink, ShieldCheck, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { verificationRateLimit } from "@/lib/ratelimit";
import { headers } from "next/headers";
import { getSystemSettings } from "@/app/actions/settings";

import { VerificationTimestamp } from "@/components/verify/VerificationTimestamp";
import { cn } from "@/lib/utils";

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
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#020617]">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900">
            <div className="bg-amber-500 p-10 text-white relative">
                <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
                    <Clock size={120} />
                </div>
                <CardHeader className="relative z-10 p-0">
                    <CardTitle className="text-2xl font-black uppercase tracking-tight">Access Throttled</CardTitle>
                    <CardDescription className="text-white/80 font-medium mt-2">Too many verification requests detected.</CardDescription>
                </CardHeader>
            </div>
          <CardContent className="p-10 text-center space-y-6">
            <p className="text-slate-500 font-medium leading-relaxed">
              You have made too many verification requests in a short period. Please wait a moment before attempting again.
            </p>
            <Button asChild variant="outline" className="h-12 w-full rounded-xl font-bold border-slate-200 dark:border-slate-800">
                <Link href="/">Return to Home</Link>
            </Button>
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
  const platformName = settings.platformName || "Loft";

  if (!user || (user.role !== "MANAGER" && user.role !== "AFFILIATE" && user.role !== "TEAM_LEADER" && user.role !== "OPERATIONS_MANAGER")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#020617]">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900">
            <div className="bg-slate-900 p-10 text-white relative">
                <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
                    <ShieldAlert size={120} />
                </div>
                <CardHeader className="relative z-10 p-0">
                    <CardTitle className="text-2xl font-black uppercase tracking-tight">Not Authorized</CardTitle>
                    <CardDescription className="text-slate-400 font-medium mt-2">Identity verification failed.</CardDescription>
                </CardHeader>
            </div>
          <CardContent className="p-10 text-center space-y-6">
            <p className="text-slate-500 font-medium leading-relaxed">
              The ambassador ID <span className="font-black text-slate-900 dark:text-white underline decoration-[#E87154]">{ambassadorId}</span> could not be verified in our official records.
            </p>
            <Button asChild variant="outline" className="h-12 w-full rounded-xl font-bold border-slate-200 dark:border-slate-800">
                <Link href="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = user.ambassadorExpiry ? new Date() > user.ambassadorExpiry : false;
  const isActive = user.status === "ACTIVE" && !isExpired;
  
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  const roleDisplay = user.role.replace(/_/g, ' ');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#020617] transition-colors duration-500">
       {/* Dynamic Background Elements */}
       <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#E87154]/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] right-[20%] w-[35%] h-[35%] bg-emerald-500/5 rounded-full blur-[110px]" />
      </div>

      <div className="mb-10 flex flex-col items-center relative z-10">
        <div className="flex items-center gap-4 group">
            {logoUrl ? (
                <div className="relative w-12 h-12 p-1.5 bg-white rounded-2xl shadow-xl border border-stone-100 transition-transform group-hover:rotate-6 duration-300">
                    <img 
                        src={logoUrl} 
                        alt={platformName} 
                        className="object-contain w-full h-full"
                    />
                </div>
            ) : (
                <div className="h-12 w-12 rounded-2xl bg-[#E87154] flex items-center justify-center text-white shadow-lg">
                    <Sparkles size={24} />
                </div>
            )}
            <span className="text-3xl font-black tracking-tighter text-slate-900 uppercase">{platformName}</span>
        </div>
        <div className="h-8 w-px bg-stone-200 my-4" />
        <h1 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Official Credential Verification</h1>
      </div>

      <Card className="w-full max-w-md border-none shadow-xl overflow-hidden rounded-[2.5rem] bg-white relative z-10">
        <div className="bg-[#FFFAF5] p-10 border-b border-stone-100 relative">
          <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12 scale-110">
              {isActive ? <ShieldCheck size={160} className="text-stone-900" /> : <AlertCircle size={160} className="text-stone-900" />}
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white bg-white flex items-center justify-center shadow-lg group transition-all duration-500">
                {user.profilePictureUrl ? (
                  <img 
                    src={user.profilePictureUrl} 
                    alt={fullName} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                  />
                ) : (
                  <User className="w-16 h-16 text-slate-200" />
                )}
              </div>
              <div className="absolute -bottom-3 -right-3">
                {isActive ? (
                  <div className="bg-[#E87154] text-white p-2 rounded-2xl border-4 border-white shadow-md">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="bg-red-500 text-white p-2 rounded-2xl border-4 border-white shadow-md">
                    <XCircle className="w-8 h-8" />
                  </div>
                ) }
              </div>
            </div>
            
            <div className="text-center space-y-1 mt-2">
                <h2 className="text-3xl font-black tracking-tight text-slate-900">{fullName || "Staff Member"}</h2>
                <div className="flex items-center justify-center gap-2 pt-1">
                    <Badge variant="outline" className="border-stone-200 text-stone-500 bg-white shadow-sm text-[10px] font-black uppercase tracking-[0.2em] px-3 h-6">
                        {roleDisplay}
                    </Badge>
                </div>
            </div>
          </div>
        </div>

        <CardContent className="p-10 space-y-10">
          {/* Status Banner */}
          <div className="flex justify-center">
            {isActive ? (
              <div className="flex items-center gap-3 px-8 py-3 bg-emerald-50 border-2 border-emerald-100 rounded-2xl shadow-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black tracking-[0.3em] text-emerald-700 uppercase">Verified Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-8 py-3 bg-red-50 border-2 border-red-100 rounded-2xl shadow-sm">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-xs font-black tracking-[0.3em] text-red-700 uppercase">Access Expired</span>
              </div>
            )}
          </div>

          {/* Staff Details */}
          <div className="bg-stone-50 rounded-[1.5rem] p-8 space-y-6 shadow-inner border-none">
            <div className="flex justify-between items-center group">
                <span className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] group-hover:text-[#E87154] transition-colors">Staff ID</span>
                <span className="font-mono font-black text-slate-900 text-base tracking-tighter">{user.ambassadorId}</span>
            </div>

            <div className="h-px bg-stone-200/50" />

            <div className="flex justify-between items-center group">
                <span className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] group-hover:text-[#E87154] transition-colors">
                {isActive ? 'Valid Until' : 'Expired On'}
                </span>
                <span className="font-black text-slate-900 text-base">
                {!isActive 
                    ? (user.ambassadorExpiry && isExpired 
                        ? format(new Date(user.ambassadorExpiry), "MMM dd, yyyy") 
                        : format(new Date(user.updatedAt), "MMM dd, yyyy"))
                    : (user.ambassadorExpiry 
                        ? format(new Date(user.ambassadorExpiry), "MMM dd, yyyy") 
                        : 'Permanent Role')}
                </span>
            </div>
          </div>

          {/* Action Zone */}
          <div className="space-y-4">
            {isActive && (user.role === "AFFILIATE" || user.role === "TEAM_LEADER") && (
              <Button asChild className="w-full h-14 rounded-2xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-xl shadow-[#E87154]/20 transition-all active:scale-95 text-white text-base group">
                <Link href={`/join/customer/${user.inviteCode}`} className="flex items-center justify-center gap-3">
                  Visit Library
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            )}
            
            {isActive && (user.role === "MANAGER" || user.role === "OPERATIONS_MANAGER") && (
              <Button asChild className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black font-black shadow-xl transition-all active:scale-95 text-white text-base group">
                <Link href={`/join/affiliate/${user.inviteCode}`} className="flex items-center justify-center gap-3">
                  Join the Team
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            )}

            <div className="pt-4 flex flex-col items-center gap-4">
                <div className="text-center space-y-1">
                    <p className="text-[9px] uppercase font-black text-slate-300 tracking-[0.4em]">
                    Verified At
                    </p>
                    <VerificationTimestamp />
                </div>

                <a 
                    href={`mailto:support@loft.com?subject=Verification%20Query:%20${ambassadorId}`}
                    className="text-[9px] font-black text-slate-400 hover:text-[#E87154] transition-colors uppercase tracking-[0.2em] underline underline-offset-4"
                >
                    Report an Issue
                </a>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <p className="mt-12 text-slate-400 text-[10px] text-center max-w-[280px] font-bold leading-relaxed uppercase tracking-[0.3em] opacity-50">
        Loft Verification Node. All rights reserved.
      </p>
    </div>
  );
}
