import { getApplicantForConfirmation } from "@/app/actions/recruitment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ConfirmButton } from "./ConfirmButton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirm Audition | LOFT",
  description: "Confirm your attendance for the LOFT Reading Club audition.",
};

export default async function ConfirmAuditionPage({
  params,
}: {
  params: Promise<{ applicantId: string }>;
}) {
  const resolvedParams = await params;
  const applicantId = resolvedParams.applicantId;

  const res = await getApplicantForConfirmation(applicantId);

  if (res.error || !res.applicant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Applicant Not Found</h1>
            <p className="text-slate-600 mb-6">
              We couldn't find an application matching this ID. Please double-check your link or contact support.
            </p>
            <Link href="/recruitment">
              <Button variant="outline" className="w-full">Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { applicant } = res;

  if (applicant.status === "AUDITION_CONFIRMED") {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-2xl bg-white/5 backdrop-blur-xl">
          <CardContent className="pt-10 pb-8 text-center px-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
            <h1 className="text-3xl font-black text-white mb-3 tracking-tight">You're Confirmed!</h1>
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              Your attendance for the audition has been successfully recorded. We look forward to meeting you!
            </p>
            
            {applicant.auditionSession && (
              <div className="bg-white/10 rounded-2xl p-5 text-left space-y-4 border border-white/10">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-[#E87154] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-0.5">Date</p>
                    <p className="text-white font-medium">{format(new Date(applicant.auditionSession.event.date), "EEEE, MMMM d, yyyy")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#E87154] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-0.5">Time</p>
                    <p className="text-white font-medium">
                      {format(new Date(applicant.auditionSession.startTime), "h:mm a")} - {format(new Date(applicant.auditionSession.endTime), "h:mm a")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#E87154] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-0.5">Venue</p>
                    <p className="text-white font-medium">{applicant.auditionSession.event.venue}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (applicant.status !== "AUDITION_INVITED") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Status</h1>
            <p className="text-slate-600 mb-6">
              Your application is currently marked as <strong>{applicant.status.replace(/_/g, " ")}</strong>. You can only confirm attendance if you have an active audition invitation.
            </p>
            <Link href="/recruitment">
              <Button variant="outline" className="w-full">Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#E87154]/20 blur-[100px] rounded-full pointer-events-none" />

      <Card className="max-w-md w-full border-none shadow-2xl bg-white/5 backdrop-blur-xl relative z-10 overflow-hidden">
        {/* Top Header Bar */}
        <div className="h-2 bg-gradient-to-r from-purple-500 to-[#E87154] w-full" />
        
        <CardHeader className="pb-2 pt-8 text-center">
          <div className="inline-flex bg-[#E87154]/20 text-[#E87154] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            Audition Invitation
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-white">Confirm Attendance</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-8 px-6 pb-8 pt-4">
          <div className="text-center space-y-2">
            <p className="text-slate-300 text-lg">Hello, <span className="text-white font-bold">{applicant.fullName.split(' ')[0]}</span>!</p>
            <p className="text-slate-400 text-sm">Please confirm your availability for the upcoming facilitator audition below.</p>
          </div>

          {applicant.auditionSession ? (
            <div className="bg-white/5 rounded-2xl p-5 space-y-4 border border-white/10">
              <div className="flex items-start gap-4">
                <div className="bg-purple-500/20 p-2.5 rounded-xl text-purple-400 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Date</p>
                  <p className="text-white font-medium text-sm">{format(new Date(applicant.auditionSession.event.date), "EEEE, MMMM d, yyyy")}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-[#E87154]/20 p-2.5 rounded-xl text-[#E87154] shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Time</p>
                  <p className="text-white font-medium text-sm">
                    {format(new Date(applicant.auditionSession.startTime), "h:mm a")} - {format(new Date(applicant.auditionSession.endTime), "h:mm a")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-blue-500/20 p-2.5 rounded-xl text-blue-400 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Venue</p>
                  <p className="text-white font-medium text-sm">{applicant.auditionSession.event.venue}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
              <p className="text-sm text-amber-200">
                You have been invited, but specific audition details haven't been assigned yet. You can still confirm your interest!
              </p>
            </div>
          )}

          <ConfirmButton applicantId={applicantId} />
        </CardContent>
      </Card>
    </div>
  );
}
