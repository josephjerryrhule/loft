"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { BookOpen, Calendar, Clock, MapPin, Loader2, CheckCircle2, Lock, Eye, AlertCircle, LogOut, Home, FileText, CheckSquare, Save, CheckCircle, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { bookAuditionSession, saveQuestionnaireResponses } from "@/app/actions/recruitment";
import Link from "next/link";
import { QUESTIONNAIRE_QUESTIONS, JUNGLE_ANIMAL_QUESTION } from "@/lib/questionnaire-data";

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
  const [activeTab, setActiveTab] = useState<"audition" | "guide" | "library" | "questionnaire">("audition");

  // Load initial questionnaire responses
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try {
      const parsed = initialData.applicant.questionnaireResponses 
        ? JSON.parse(initialData.applicant.questionnaireResponses) 
        : {};
      return parsed.answers || {};
    } catch (e) {
      return {};
    }
  });

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");

  const saveAnswers = async (updatedAnswers: Record<string, string>) => {
    setSaveStatus("saving");
    try {
      const res = await saveQuestionnaireResponses(
        data.applicant.applicantId, 
        JSON.stringify({ answers: updatedAnswers })
      );
      if (res.success) {
        setSaveStatus("saved");
      } else {
        setSaveStatus("error");
      }
    } catch (e) {
      setSaveStatus("error");
    }
  };

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const handleTextChange = (val: string) => {
    const updated = { ...answers, whyAnimal: val };
    setAnswers(updated);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus("saving");
    debounceRef.current = setTimeout(() => {
      saveAnswers(updated);
    }, 1000);
  };

  const handleSelectAnswer = (qId: string, value: string) => {
    const updated = { ...answers, [qId]: value };
    setAnswers(updated);
    saveAnswers(updated);
  };

  // Interactive Checklist (saves locally in localStorage)
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`checklist_${data.applicant.applicantId}`);
        if (saved) setChecklist(JSON.parse(saved));
      } catch (e) {}
    }
  }, [data.applicant.applicantId]);

  const toggleChecklistItem = (key: string) => {
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(`checklist_${data.applicant.applicantId}`, JSON.stringify(updated));
    }
  };

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
  const hasBooked = ["AUDITION_SLOT_BOOKED", "AUDITION_CONFIRMED", "AUDITION_ATTENDED"].includes(applicant.status);
  const areSlotsAvailable = data.availableSessions && data.availableSessions.length > 0;
  const isBookingOpen = areSlotsAvailable || ["AUDITION_BOOKING_OPEN", "AUDITION_INVITED", "SHORTLISTED"].includes(applicant.status);

  // Questionnaire Completion metrics
  const totalQuestions = QUESTIONNAIRE_QUESTIONS.length + 2; // q1-q15 + animal + whyAnimal
  const answeredCount = [
    ...QUESTIONNAIRE_QUESTIONS.map(q => q.id),
    "animal",
    "whyAnimal"
  ].filter(id => answers[id] && answers[id].trim() !== "").length;
  const isQuestionnaireComplete = answeredCount === totalQuestions;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 no-select" onContextMenu={(e) => e.preventDefault()}>
      <div className="bg-[#4B2E83] w-full -mt-28 pt-40 pb-16 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-white">
            <h1 className="text-3xl sm:text-4xl font-black mb-2">Welcome, {applicant.fullName}</h1>
            <p className="text-purple-200 font-mono text-lg tracking-wider">{applicant.applicantId}</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Badge className="px-4 py-2.5 text-sm font-bold uppercase tracking-widest bg-white text-[#4B2E83] border-none shadow-lg">
              {getStatusLabel(applicant.status)}
            </Badge>
            <Link href="/recruitment/portal" className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors backdrop-blur-sm border border-white/20">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Portal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="bg-white p-1.5 rounded-2xl shadow-md border border-slate-200/60 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab("audition")}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer flex-1 justify-center sm:flex-initial",
              activeTab === "audition"
                ? "bg-[#4B2E83] text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <Calendar className="w-4 h-4" />
            <span>My Audition</span>
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer flex-1 justify-center sm:flex-initial",
              activeTab === "guide"
                ? "bg-[#4B2E83] text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <FileText className="w-4 h-4" />
            <span>Preparation Guide</span>
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer flex-1 justify-center sm:flex-initial",
              activeTab === "library"
                ? "bg-[#4B2E83] text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <BookOpen className="w-4 h-4" />
            <span>LOFT Library</span>
          </button>
          <button
            onClick={() => setActiveTab("questionnaire")}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer flex-1 justify-center sm:flex-initial relative",
              activeTab === "questionnaire"
                ? "bg-[#4B2E83] text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Guide Questionnaire</span>
            {answeredCount > 0 && (
              <span className={cn(
                "absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white text-white shadow",
                isQuestionnaireComplete ? "bg-emerald-500" : "bg-[#E87154]"
              )}>
                {isQuestionnaireComplete ? "✓" : answeredCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
        {/* Tab 1: Audition Info / Booking */}
        {activeTab === "audition" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {!hasBooked && areSlotsAvailable && (
              <Card className="border-slate-200 shadow-xl rounded-2xl overflow-hidden border-t-4 border-t-[#E87154]">
                <CardHeader className="bg-white pb-4 border-b border-slate-100">
                  <CardTitle className="text-2xl font-black text-slate-900">Book Your Audition</CardTitle>
                  <CardDescription>Select an available time slot below to confirm your audition.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 bg-slate-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.availableSessions.map((event: any) =>
                      event.sessions.map((session: any) => (
                        <div key={session.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:border-[#E87154] hover:shadow-md transition-all duration-200">
                          <div className="space-y-3 mb-4">
                            <h4 className="font-bold text-lg text-slate-900">{event.name}</h4>
                            <div className="space-y-1.5 text-sm text-slate-600">
                              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[#E87154]" /> {format(new Date(event.date), "EEEE, MMMM do, yyyy")}</div>
                              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#E87154]" /> {format(new Date(session.startTime), "h:mm a")} - {format(new Date(session.endTime), "h:mm a")}</div>
                              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#E87154]" /> <a href={event.locationUrl || `https://maps.google.com/?q=${encodeURIComponent(event.venue)}`} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-[#E87154] transition-colors">{event.venue}</a></div>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-slate-100">
                            <Button 
                              onClick={() => handleBookSession(session.id)}
                              disabled={isBooking !== null}
                              className="w-full bg-[#E87154] hover:bg-[#D66144] text-white font-bold rounded-xl h-12 shadow-sm hover:shadow-md transition-all cursor-pointer"
                            >
                              {isBooking === session.id ? (
                                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Booking...</>
                              ) : (
                                "Book this Slot"
                              )}
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {!hasBooked && !areSlotsAvailable && (
              <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-slate-50 border-amber-200">
                <CardContent className="p-8 text-center text-slate-600">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Awaiting Audition Dates</h3>
                  <p className="text-slate-600 max-w-lg mx-auto leading-relaxed">We are currently finalizing audition dates and schedules. Auditions are expected to take place in August; however, it is very possible that auditions may begin sooner than that.</p>
                  <p className="text-slate-600 max-w-lg mx-auto mt-4 leading-relaxed font-medium">As soon as audition slots become available, we will notify you via both email and WhatsApp. You will then be able to book your preferred audition slot right here.</p>
                </CardContent>
              </Card>
            )}

            {hasBooked && data.applicant.auditionSession && (
              <Card className="border-slate-200 shadow-xl rounded-2xl overflow-hidden border-t-4 border-t-emerald-500 bg-gradient-to-br from-emerald-50 to-white">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-900">Audition Booked</h3>
                        <p className="text-slate-600 mt-1 max-w-md">
                          Your audition slot has been successfully confirmed. We look forward to seeing you!
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-emerald-100 text-center md:text-left min-w-[240px]">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Your Session</p>
                      <p className="font-bold text-slate-900">{data.applicant.auditionSession.event?.name || "Audition Session"}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-600">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#E87154]" /> {format(new Date(data.applicant.auditionSession.event?.date), "MMM do, yyyy")}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#E87154]" /> {format(new Date(data.applicant.auditionSession.startTime), "h:mm a")}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#E87154]" /> <a href={data.applicant.auditionSession.event?.locationUrl || `https://maps.google.com/?q=${encodeURIComponent(data.applicant.auditionSession.event?.venue || '')}`} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-[#E87154] transition-colors">{data.applicant.auditionSession.event?.venue}</a></span>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm mt-6 text-center md:text-left">
                    Remember to use the <span className="font-bold text-[#E87154]">Facilitator Preparation tabs</span> above to get ready!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tab 2: Audition Preparation Guide */}
        {activeTab === "guide" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <Card className="border-slate-200 shadow-lg rounded-3xl overflow-hidden bg-white">
              <div className="bg-gradient-to-r from-[#4B2E83] to-[#633CA3] py-8 px-6 sm:px-8 text-white">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">LOFT Guide Audition Preparation Guide</h2>
                <p className="text-purple-200 mt-2 text-sm sm:text-base font-medium">Read carefully through our structure, activities, and tips to ensure you are fully set for success.</p>
              </div>
              <CardContent className="p-6 sm:p-8 space-y-8 text-slate-700">
                {/* Welcome */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#4B2E83] border-b pb-2 border-purple-100">Welcome</h3>
                  <div className="space-y-3 text-slate-600 leading-relaxed">
                    <p className="font-bold text-slate-800">Congratulations on completing your application!</p>
                    <p>Thank you for applying to become a LOFT Guide.</p>
                    <p>
                      This guide will help you prepare for your audition. The audition has been designed to reflect a real LOFT session, so that you can experience what it's like to facilitate children while allowing us to get to know you.
                    </p>
                    <p>
                      Remember, we are not looking for perfection. We are looking for Guides who are warm, enthusiastic, patient, creative, and able to help children grow in confidence.
                    </p>
                    <p className="font-semibold text-[#E87154] flex items-center gap-1.5 bg-orange-50 px-3.5 py-2 rounded-xl w-fit">
                      <Clock className="w-4 h-4" />
                      <span>Your audition will last approximately 5 minutes.</span>
                    </p>
                  </div>
                </div>

                {/* What to Expect */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#4B2E83] border-b pb-2 border-purple-100">What to Expect</h3>
                  <p className="text-slate-600">During your audition, you will complete three short activities:</p>
                  <ul className="list-decimal pl-5 space-y-2 text-slate-600 font-medium">
                    <li>Introduce yourself to a class and read a Little LOFTERS story.</li>
                    <li>Introduce yourself to a class and read a LOFT 365 story.</li>
                    <li>Respond to three short classroom scenarios.</li>
                  </ul>
                </div>

                {/* Activity 1 */}
                <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-lg text-slate-900">Activity 1 – Little LOFTERS Reading (Ages 0–3)</h4>
                  <p className="text-slate-600">Choose one Little LOFTERS book from your LOFT Library.</p>
                  <p className="text-slate-600">During the audition, read it as though you are welcoming and reading to a class of toddlers.</p>
                  <div className="pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">We are looking to see how well you:</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600 font-medium pl-4 list-disc">
                      <li>Welcome young children.</li>
                      <li>Capture their attention.</li>
                      <li>Speak clearly and warmly.</li>
                      <li>Use facial expressions and gestures.</li>
                      <li>Make the story exciting and interactive.</li>
                      <li>Encourage participation.</li>
                    </ul>
                  </div>
                </div>

                {/* Activity 2 */}
                <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-lg text-slate-900">Activity 2 – LOFT 365 Reading (Ages 4–7)</h4>
                  <p className="text-slate-600">Choose one LOFT 365 book from your LOFT Library.</p>
                  <p className="text-slate-600">Read it as though you are leading a class of children aged 4–7.</p>
                  <div className="pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">As you read, remember to:</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600 font-medium pl-4 list-disc">
                      <li>Read with expression.</li>
                      <li>Use different voices where appropriate.</li>
                      <li>Pause naturally to ask questions.</li>
                      <li>Encourage children to think about the story.</li>
                      <li>Keep the children engaged throughout.</li>
                    </ul>
                  </div>
                  <p className="text-xs text-slate-500 font-medium italic pt-1">You may choose any book from your LOFT Library.</p>
                </div>

                {/* Beginning Your Reading Session */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#4B2E83] border-b pb-2 border-purple-100">Beginning Your Reading Session</h3>
                  <div className="space-y-3 text-slate-600">
                    <p>At the beginning of each reading activity, imagine you are meeting your class for the first time.</p>
                    <p>You do not need to memorise these exact words. We simply want to see how you would naturally welcome children.</p>
                    <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100/50 font-medium">
                      <p className="font-bold text-[#4B2E83] mb-2 uppercase text-xs tracking-wider">Guide Example Introduction:</p>
                      <p className="italic text-slate-800 whitespace-pre-line leading-relaxed">
                        "Good morning, everyone!
                        My name is ________, and I'm so happy to see you all today!
                        Before we begin, let's all put on our biggest smiles.
                        Can everyone wave hello?
                        Wonderful!
                        Today we're going on a magical story adventure together, so I need everyone to put on their listening ears, their thinking brains, and their amazing imaginations.
                        Is everyone ready?
                        Great! Let's begin our story."
                      </p>
                    </div>
                    <p className="text-sm">Feel free to make the introduction your own. We simply want to see your natural personality shine through.</p>
                  </div>
                </div>

                {/* Activity 3 */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#4B2E83] border-b pb-2 border-purple-100">Activity 3 – Facilitation Scenarios</h3>
                  <p className="text-slate-600">Working with children is full of unexpected moments.</p>
                  <p className="text-slate-600">
                    During your audition, you will be asked to respond to the following three situations. There are no perfect answers—we simply want to see how you think, communicate, and create a positive environment for children.
                  </p>
                  <div className="grid grid-cols-1 gap-4 pt-2">
                    <div className="border border-slate-200 p-5 rounded-2xl space-y-2 bg-white shadow-sm">
                      <span className="text-xs font-black uppercase text-[#E87154] tracking-widest block">Scenario 1</span>
                      <p className="text-slate-800 font-bold">You are reading your story to the class. One child keeps interrupting and talking over you because they are excited and want to share their own ideas.</p>
                      <p className="text-sm text-slate-500">Please show us how you would respond.</p>
                    </div>
                    <div className="border border-slate-200 p-5 rounded-2xl space-y-2 bg-white shadow-sm">
                      <span className="text-xs font-black uppercase text-[#E87154] tracking-widest block">Scenario 2</span>
                      <p className="text-slate-800 font-bold">Two children begin arguing because they both believe it's their turn first.</p>
                      <p className="text-sm text-slate-500">Please show us how you would handle the situation.</p>
                    </div>
                    <div className="border border-slate-200 p-5 rounded-2xl space-y-2 bg-white shadow-sm">
                      <span className="text-xs font-black uppercase text-[#E87154] tracking-widest block">Scenario 3</span>
                      <p className="text-slate-800 font-bold">One child quietly refuses to join the activity and sits by themselves while everyone else is participating.</p>
                      <p className="text-sm text-slate-500">Please show us how you would encourage them to join without forcing them.</p>
                    </div>
                  </div>
                </div>

                {/* Helpful Tips */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#4B2E83] border-b pb-2 border-purple-100">Helpful Tips</h3>
                  <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 text-slate-700">
                    <p className="font-bold text-amber-900 mb-3">As you prepare, remember to:</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-semibold text-slate-800 pl-4 list-disc text-sm">
                      <li>Smile often.</li>
                      <li>Speak clearly and confidently.</li>
                      <li>Show enthusiasm.</li>
                      <li>Be patient and encouraging.</li>
                      <li>Listen carefully.</li>
                      <li>Use positive language.</li>
                      <li>Praise children's effort.</li>
                      <li>Keep your energy warm and engaging.</li>
                      <li>Make learning feel fun.</li>
                    </ul>
                    <p className="mt-4 pt-3 border-t border-amber-200 text-sm font-bold text-amber-900">
                      Most importantly, remember that every child deserves to feel safe, seen, heard, and encouraged.
                    </p>
                  </div>
                </div>

                {/* Before You Arrive */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#4B2E83] border-b pb-2 border-purple-100">Before You Arrive</h3>
                  <div className="border border-slate-200 p-6 rounded-2xl bg-slate-50 space-y-3">
                    <p className="font-bold text-slate-900 mb-1">Please ensure that you have:</p>
                    <div className="space-y-2.5">
                      {[
                        { key: "choose_lofters", label: "Chosen one Little LOFTERS book." },
                        { key: "choose_loft365", label: "Chosen one LOFT 365 book." },
                        { key: "practice_reading", label: "Practised reading both books aloud." },
                        { key: "complete_questionnaire", label: "Completed the LOFT Guide Questionnaire." },
                        { key: "arrive_ready", label: "Arrived ready to smile, have fun, and be yourself." }
                      ].map((item) => (
                        <div 
                          key={item.key} 
                          onClick={() => toggleChecklistItem(item.key)}
                          className="flex items-start gap-3 cursor-pointer group select-none"
                        >
                          <div className={cn(
                            "w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all duration-150",
                            checklist[item.key] 
                              ? "bg-emerald-500 border-emerald-600 text-white" 
                              : "bg-white border-slate-300 group-hover:border-slate-400"
                          )}>
                            {checklist[item.key] && <span className="text-xs font-black">✓</span>}
                          </div>
                          <span className={cn(
                            "text-sm font-medium transition-all duration-150",
                            checklist[item.key] ? "text-slate-500 line-through" : "text-slate-700"
                          )}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* A Final Word */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xl font-bold text-[#4B2E83]">A Final Word</h3>
                  <div className="space-y-3 text-slate-600 leading-relaxed">
                    <p>The audition is not about delivering a perfect performance.</p>
                    <p>
                      We know that every Guide has a unique personality and style, and we celebrate that. What matters most is your willingness to learn, your love for working with children, and your ability to create a safe, joyful, and engaging environment where children can grow in confidence.
                    </p>
                    <p className="font-bold text-slate-800">Relax, enjoy the experience, and let your personality shine.</p>
                    <p>We look forward to meeting you.</p>
                    <p className="text-lg font-black text-[#E87154]">Good luck!</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 3: LOFT Library */}
        {activeTab === "library" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Audition Library Warning Block */}
            <Card className="border-purple-250 bg-purple-50/50 shadow-sm rounded-2xl border overflow-hidden">
              <CardContent className="p-6 flex flex-col sm:flex-row items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center shrink-0 text-[#4B2E83]">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#4B2E83] mb-2">Preparing for Your Audition</h3>
                  <div className="text-sm text-purple-900 space-y-2 leading-relaxed font-medium">
                    <p>For your audition, please choose:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>One Little LOFTERS book (Ages 0–3)</li>
                      <li>One LOFT 365 book (Ages 4–7)</li>
                    </ul>
                    <p>During your audition, you will read from both books as though you are facilitating a real LOFT session.</p>
                    <p className="text-[#E87154] font-bold">We encourage you to practise reading your chosen books several times before your audition.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Your LOFT Library</h2>
                  <p className="text-slate-500 mt-1">Select a book to read and practice inside the reader.</p>
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
        )}

        {/* Tab 4: Guide Questionnaire */}
        {activeTab === "questionnaire" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Auto-save Status Indicator Card */}
            <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0",
                    isQuestionnaireComplete ? "bg-emerald-500" : "bg-[#E87154]"
                  )}>
                    {isQuestionnaireComplete ? <CheckCircle size={20} /> : <FileText size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">LOFT Guide Questionnaire</h3>
                    <p className="text-xs text-slate-500 font-medium">All questions are required. Your answers will save automatically.</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                  {/* Progress bar */}
                  <div className="flex-1 sm:w-40 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600 shrink-0">
                    {answeredCount} / {totalQuestions} Answered
                  </span>

                  {/* Auto-save Indicator pill */}
                  <div className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border shrink-0",
                    saveStatus === "saving" && "bg-blue-50 text-blue-700 border-blue-100",
                    saveStatus === "saved" && "bg-emerald-50 text-emerald-700 border-emerald-100",
                    saveStatus === "error" && "bg-red-50 text-red-700 border-red-100"
                  )}>
                    {saveStatus === "saving" && (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    )}
                    {saveStatus === "saved" && (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Auto-saved</span>
                      </>
                    )}
                    {saveStatus === "error" && (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                        <span>Save Error</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions Grid */}
            <div className="space-y-6">
              {QUESTIONNAIRE_QUESTIONS.map((q, idx) => (
                <Card key={q.id} className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                  <div className="bg-slate-50 border-b border-slate-100 py-3.5 px-6 flex justify-between items-center">
                    <span className="text-xs font-black text-[#4B2E83] tracking-widest uppercase">Question {idx + 1} of {totalQuestions}</span>
                    {answers[q.id] ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Answered
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600">Required *</span>
                    )}
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <p className="font-bold text-slate-800 text-base leading-snug">{q.text}</p>
                    <div className="grid grid-cols-1 gap-2.5 pt-1">
                      {q.options.map((opt) => {
                        const isSelected = answers[q.id] === opt;
                        return (
                          <div
                            key={opt}
                            onClick={() => handleSelectAnswer(q.id, opt)}
                            className={cn(
                              "border rounded-xl p-4 cursor-pointer text-sm font-medium transition-all flex items-start gap-3 select-none",
                              isSelected 
                                ? "bg-purple-50 border-[#4B2E83] text-[#4B2E83] shadow-sm font-semibold"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50/50"
                            )}
                          >
                            <div className={cn(
                              "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all",
                              isSelected ? "border-[#4B2E83] bg-[#4B2E83]" : "border-slate-300"
                            )}>
                              {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Final Question */}
              <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                <div className="bg-slate-50 border-b border-slate-100 py-3.5 px-6 flex justify-between items-center">
                  <span className="text-xs font-black text-[#4B2E83] tracking-widest uppercase">Final Section</span>
                  {answers.animal ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Answered
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-600">Required *</span>
                  )}
                </div>
                <CardContent className="p-6 space-y-6">
                  {/* Message before final question */}
                  <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100/50 text-slate-700 text-sm leading-relaxed space-y-2">
                    <p className="font-bold text-[#4B2E83]">Well done! You've reached the end.</p>
                    <p>
                      We hope you've noticed something important: working with children is incredibly fun—but it also comes with real responsibility. Every day brings surprises, and every moment is an opportunity to encourage, inspire, and make a child feel seen.
                    </p>
                    <p className="font-medium">
                      There are no right or wrong answers to the question below. We're simply interested in learning a little more about how you think.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <p className="font-bold text-slate-800 text-base leading-snug">{JUNGLE_ANIMAL_QUESTION.text}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                      {JUNGLE_ANIMAL_QUESTION.options.map((opt) => {
                        const isSelected = answers.animal === opt;
                        return (
                          <div
                            key={opt}
                            onClick={() => handleSelectAnswer("animal", opt)}
                            className={cn(
                              "border rounded-xl p-4 cursor-pointer text-sm font-bold transition-all text-center select-none flex flex-col items-center gap-2",
                              isSelected 
                                ? "bg-purple-50 border-[#4B2E83] text-[#4B2E83] shadow-sm"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50"
                            )}
                          >
                            <span className="text-3xl">{opt.split(" ")[0]}</span>
                            <span className="text-xs tracking-wide">{opt.split(" ")[1]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Follow-up question */}
                  <div className="space-y-2.5 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <label htmlFor="whyAnimal" className="font-bold text-slate-800 text-sm">Why did you choose that animal? *</label>
                      {answers.whyAnimal && answers.whyAnimal.trim() !== "" ? (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Answered
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-600">Required *</span>
                      )}
                    </div>
                    <textarea
                      id="whyAnimal"
                      rows={4}
                      placeholder="Write your explanation here..."
                      value={answers.whyAnimal || ""}
                      onChange={(e) => handleTextChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4B2E83] focus:border-[#4B2E83] bg-white"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

