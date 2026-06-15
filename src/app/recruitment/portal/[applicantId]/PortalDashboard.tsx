"use client";

import { useState } from "react";
import { format } from "date-fns";
import { BookOpen, Calendar, Clock, MapPin, Loader2, CheckCircle2, Lock, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { bookAuditionSession } from "@/app/actions/recruitment";

const ReliableFlipbookViewer = dynamic(
  () => import("@/components/flipbook/ReliableFlipbookViewer").then((mod) => mod.ReliableFlipbookViewer),
  { ssr: false }
);

function getStatusLabel(status: string) {
  switch (status) {
    case "AWAITING_AUDITION_SLOT_RELEASE": return "Awaiting Audition Dates";
    case "AUDITION_BOOKING_OPEN": return "Book Your Audition";
    case "AUDITION_SLOT_BOOKED": return "Audition Booked";
    case "AUDITION_CONFIRMED": return "Audition Confirmed";
    case "AUDITION_ATTENDED": return "Audition Attended";
    default: return status.replace(/_/g, " ");
  }
}

function getAgeGroupLabel(group: string) {
  const map: Record<string, string> = {
    toddlers: "Toddlers (1-3)",
    preschoolers: "Preschoolers (3-5)",
    early_readers: "Early Readers (5-7)",
    middle_grade: "Middle Grade (8-12)",
    young_adult: "Young Adult (13-18)"
  };
  return map[group] || group;
}

function PortalBookItem({ book }: { book: any }) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const aspect = dimensions ? dimensions.width / dimensions.height : 0.75;
  const cappedAspect = Math.max(0.5, Math.min(2.0, aspect));

  return (
    <div className="group flex flex-col w-full">
      <div className="w-full relative flex items-center justify-center">
        <div
          className="block w-full max-h-[280px] transition-all duration-300 ease-out group-hover:scale-[1.03] group-hover:-translate-y-1.5 text-left shadow-[0_12px_24px_-8px_rgba(0,0,0,0.25)] group-hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.35)] rounded-[4px] relative mx-auto overflow-hidden bg-slate-50 border border-black/5"
          style={{ aspectRatio: `${cappedAspect}` }}
        >
          {book.coverImageUrl ? (
            <img
              src={book.coverImageUrl}
              alt={book.title}
              onLoad={(e) => {
                const { naturalWidth, naturalHeight } = e.currentTarget;
                if (naturalWidth && naturalHeight) {
                  setDimensions({ width: naturalWidth, height: naturalHeight });
                }
                setLoaded(true);
              }}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                loaded ? "opacity-100" : "opacity-0"
              )}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FFFAF5] p-4 text-center">
              <BookOpen className="h-8 w-8 text-[#E87154] mb-2" />
              <span className="text-stone-850 font-bold text-xs sm:text-sm leading-tight line-clamp-3">
                {book.title}
              </span>
            </div>
          )}
          
          <div className="absolute inset-y-0 left-0 w-[8px] bg-gradient-to-r from-black/15 via-black/5 to-transparent pointer-events-none z-20" />
          <div className="absolute inset-y-0 left-[8px] w-[1px] bg-white/10 pointer-events-none z-20" />
          
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
            {book.ageGroup ? (
              <Badge className="bg-blue-500 text-white font-bold text-[8px] px-1.5 py-0.5 rounded border-none tracking-wide w-fit">
                {getAgeGroupLabel(book.ageGroup)}
              </Badge>
            ) : (
              <Badge className="bg-slate-500 text-white font-bold text-[8px] px-1.5 py-0.5 rounded border-none tracking-wide w-fit">
                All Ages
              </Badge>
            )}
          </div>

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 z-30">
            <div className="flex items-center justify-center p-1.5 bg-white rounded-full shadow-lg border border-slate-100/10">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewOpen(true)} 
                title="View Flipbook"
                className="text-slate-700 hover:bg-slate-100 h-8 w-8 p-0 cursor-pointer"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {viewOpen && (
        <ReliableFlipbookViewer 
          pdfUrl={book.pdfUrl || ""} 
          iframeContent={book.iframeContent}
          onClose={() => setViewOpen(false)} 
          title={book.title}
        />
      )}

      <div className="text-left w-full mt-2.5">
        <h3 className="font-bold text-slate-900 line-clamp-1 text-sm sm:text-base leading-tight">
          {book.title}
        </h3>
      </div>
    </div>
  );
}

export function PortalDashboard({ initialData }: { initialData: any }) {
  const [data, setData] = useState(initialData);
  const [isBooking, setIsBooking] = useState<string | null>(null);

  const handleBookSession = async (sessionId: string) => {
    setIsBooking(sessionId);
    try {
      const res = await bookAuditionSession(data.applicant.applicantId, sessionId);
      if (res.success && "applicant" in res) {
        setData((prev: any) => ({
          ...prev,
          applicant: res.applicant,
        }));
      } else {
        alert("error" in res ? res.error : "Failed to book session");
      }
    } catch (error) {
      alert("An unexpected error occurred.");
    } finally {
      setIsBooking(null);
    }
  };

  const applicant = data.applicant;
  const isBookingOpen = applicant.status === "AUDITION_BOOKING_OPEN";
  const hasBooked = ["AUDITION_SLOT_BOOKED", "AUDITION_CONFIRMED", "AUDITION_ATTENDED"].includes(applicant.status);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-[#4B2E83] pt-28 pb-16 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-white">
            <h1 className="text-3xl sm:text-4xl font-black mb-2">Welcome, {applicant.fullName}</h1>
            <p className="text-purple-200 font-mono text-lg tracking-wider">{applicant.applicantId}</p>
          </div>
          <Badge className="px-4 py-2 text-sm font-bold uppercase tracking-widest bg-white/20 hover:bg-white/30 border-none text-white backdrop-blur-sm">
            Status: {getStatusLabel(applicant.status)}
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8 space-y-8">
        
        {/* Booking Section */}
        {isBookingOpen && data.availableSessions && data.availableSessions.length > 0 && (
          <Card className="border-slate-200 shadow-xl rounded-2xl overflow-hidden border-t-4 border-t-[#E87154]">
            <CardHeader className="bg-white pb-4 border-b border-slate-100">
              <CardTitle className="text-2xl font-black text-slate-900">Book Your Audition</CardTitle>
              <CardDescription>Select an available time slot below to confirm your audition.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.availableSessions.map((event: any) => (
                  event.sessions.map((session: any) => (
                    <div key={session.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-[#E87154] transition-colors">
                      <div className="space-y-3 mb-4">
                        <h4 className="font-bold text-lg text-slate-900">{event.name}</h4>
                        <div className="space-y-1 text-sm text-slate-600">
                          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[#E87154]" /> {format(new Date(event.date), "EEEE, MMMM do, yyyy")}</div>
                          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#E87154]" /> {format(new Date(session.startTime), "h:mm a")} - {format(new Date(session.endTime), "h:mm a")}</div>
                          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#E87154]" /> {event.venue}</div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleBookSession(session.id)}
                        disabled={isBooking !== null}
                        className="w-full bg-[#1a1a1a] hover:bg-black text-white font-bold rounded-lg"
                      >
                        {isBooking === session.id ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Booking...</> : "Book this Slot"}
                      </Button>
                    </div>
                  ))
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isBookingOpen && data.availableSessions?.length === 0 && (
          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-8 text-center text-slate-600">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Slots Available</h3>
              <p>Audition booking is open, but all currently released slots are full. Please check back later.</p>
            </CardContent>
          </Card>
        )}

        {hasBooked && (
          <Card className="border-slate-200 shadow-xl rounded-2xl overflow-hidden border-t-4 border-t-emerald-500">
            <CardContent className="p-8 flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Audition Booked</h3>
                <p className="text-slate-600">
                  Your audition slot has been successfully confirmed. We look forward to seeing you. 
                  Remember to use the Facilitator Preparation Library to get ready!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Library Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Facilitator Preparation Library</h2>
              <p className="text-slate-500 mt-1">Familiarize yourself with LOFT's storytelling style.</p>
            </div>
            {data.hasLibraryAccess && (
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Access Expires</p>
                <p className="font-medium text-slate-700">{format(new Date(data.accessExpiryDate), "MMM do, yyyy")}</p>
              </div>
            )}
          </div>

          {!data.hasLibraryAccess ? (
            <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-slate-50">
              <CardContent className="p-12 text-center text-slate-500 flex flex-col items-center">
                <Lock className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Access Expired</h3>
                <p className="max-w-md">Your 1-month access to the Facilitator Preparation Library has expired.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-200">
              <div className="grid gap-x-6 gap-y-10 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {data.libraryFlipbooks.length === 0 ? (
                  <div className="col-span-full text-center py-20 text-slate-400">
                    <BookOpen className="h-10 w-10 opacity-20 mx-auto mb-2" />
                    <p>No books available in the library yet.</p>
                  </div>
                ) : (
                  data.libraryFlipbooks.map((book: any) => (
                    <PortalBookItem key={book.id} book={book} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
