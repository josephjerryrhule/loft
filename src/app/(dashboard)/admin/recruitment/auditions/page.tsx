"use client";

import { useState, useEffect } from "react";
import { 
  getAuditionEventsForAdmin, 
  createAuditionEvent, 
  createAuditionSession, 
  deleteAuditionEvent,
  releaseAuditionSlots,
  submitAuditionScore
} from "@/app/actions/recruitment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { MapPin, Users, Plus, Trash2, Clock, Star, Loader2, ChevronLeft, ChevronRight, Video, FileText, CheckCircle2, Unlock, Lock, Megaphone } from "lucide-react";
import { format, isSameDay, startOfDay } from "date-fns";
import { AddApplicantToSessionDialog } from "./_components/AddApplicantToSessionDialog";
import { AssignSessionDialog } from "@/app/(dashboard)/admin/recruitment/[applicantId]/_components/AssignSessionDialog";

// Pastel colors to mimic the reference image schedule blocks
const PASTEL_COLORS = [
  { bg: "bg-[#fce4ec]", text: "text-[#ad1457]", border: "border-[#f8bbd0]" }, // Pink
  { bg: "bg-[#e3f2fd]", text: "text-[#1565c0]", border: "border-[#bbdefb]" }, // Blue
  { bg: "bg-[#e8f5e9]", text: "text-[#2e7d32]", border: "border-[#c8e6c9]" }, // Green
  { bg: "bg-[#fff3e0]", text: "text-[#e65100]", border: "border-[#ffe0b2]" }, // Orange
  { bg: "bg-[#f3e5f5]", text: "text-[#6a1b9a]", border: "border-[#e1bee7]" }, // Purple
];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function AuditionsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // New Event State
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: "", date: "", venue: "", description: "", maxCapacity: "" });
  
  // Scoring State
  const [scoringApplicant, setScoringApplicant] = useState<any>(null);
  const [scoreSessionId, setScoreSessionId] = useState<string>("");
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [scoreData, setScoreData] = useState({
    evaluatorName: "",
    readingAbility: 5,
    storytellingAbility: 5,
    childEngagement: 5,
    communicationSkills: 5,
    confidence: 5,
    improvisation: 5,
    overallRecommendation: 5,
    evaluatorNotes: "",
    attended: true
  });

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await getAuditionEventsForAdmin();
      if (!res.error && res.events) setEvents(res.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  const handleCreateEvent = async () => {
    setIsCreatingEvent(true);
    try {
      await createAuditionEvent({
        ...newEvent,
        maxCapacity: newEvent.maxCapacity ? parseInt(newEvent.maxCapacity) : undefined
      });
      setNewEvent({ name: "", date: "", venue: "", description: "", maxCapacity: "" });
      setIsCreateModalOpen(false);
      await loadEvents();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event? This will unassign all applicants.")) return;
    try {
      await deleteAuditionEvent(id);
      await loadEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const [releasingEventId, setReleasingEventId] = useState<string | null>(null);

  const handleReleaseSlots = async (eventId: string, release: boolean) => {
    const action = release ? "release" : "close";
    if (!confirm(`Are you sure you want to ${action} audition slots for this event?${release ? " Eligible applicants will be able to book." : " New bookings will be prevented."}`)) return;
    
    setReleasingEventId(eventId);
    try {
      const res = await releaseAuditionSlots(eventId, release);
      if (res.error) {
        alert(res.error);
      } else {
        alert(res.message);
      }
      await loadEvents();
    } catch (err) {
      console.error(err);
      alert("Failed to update event.");
    } finally {
      setReleasingEventId(null);
    }
  };

  const handleCreateSession = async (eventId: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const startTime = (form.elements.namedItem("startTime") as HTMLInputElement).value;
    const endTime = (form.elements.namedItem("endTime") as HTMLInputElement).value;
    const capacityInput = form.elements.namedItem("capacity") as HTMLInputElement | null;
    const capacity = capacityInput?.value;
    
    const eventDate = events.find(ev => ev.id === eventId)?.date || new Date().toISOString();
    const dateStr = new Date(eventDate).toISOString().split('T')[0];
    
    try {
      await createAuditionSession({
        eventId,
        startTime: `${dateStr}T${startTime}:00Z`,
        endTime: `${dateStr}T${endTime}:00Z`,
        maxCapacity: capacity ? parseInt(capacity) : undefined
      });
      form.reset();
      await loadEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitScore = async () => {
    if (!scoringApplicant) return;
    setIsSubmittingScore(true);
    try {
      await submitAuditionScore({
        applicantId: scoringApplicant.applicantId,
        sessionId: scoreSessionId || undefined,
        ...scoreData
      });
      setScoringApplicant(null);
      setIsScoreModalOpen(false);
      await loadEvents();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const openScoreModal = (app: any, sessionId: string) => {
    setScoringApplicant(app);
    setScoreSessionId(sessionId);
    setScoreData({
      evaluatorName: "", readingAbility: 5, storytellingAbility: 5, childEngagement: 5,
      communicationSkills: 5, confidence: 5, improvisation: 5, overallRecommendation: 5,
      evaluatorNotes: "", attended: true
    });
    setIsScoreModalOpen(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;
  }

  // Filter events by selected date (or show all if no date selected)
  const displayedEvents = selectedDate 
    ? events.filter(e => isSameDay(new Date(e.date), selectedDate))
    : events;

  // Next Upcoming Event for Sidebar
  const upcomingEvents = [...events].filter(e => new Date(e.date) >= startOfDay(new Date())).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextEvent = upcomingEvents[0];

  const ScoreRow = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
    <div className="flex items-center justify-between group">
      <Label className="text-sm text-slate-600 font-medium w-1/3 group-hover:text-slate-900 transition-colors">{label}</Label>
      <div className="flex-1 flex items-center justify-end gap-1">
        {[1,2,3,4,5,6,7,8,9,10].map(v => (
          <button 
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`w-6 h-8 rounded text-xs font-bold transition-all ${value >= v ? 'bg-[#E87154] text-white shadow-sm' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
      
      {/* LEFT SIDEBAR */}
      <div className="w-[300px] shrink-0 flex flex-col gap-6 overflow-y-auto pb-6 hidden lg:flex">
        
        {/* Calendar Picker */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md mx-auto"
            classNames={{
              day_selected: "bg-[#E87154] text-white hover:bg-[#E87154] hover:text-white focus:bg-[#E87154] focus:text-white",
              day_today: "bg-slate-100 text-slate-900"
            }}
          />
        </div>

        {/* Next Event Reminder */}
        {nextEvent && (
          <div className="bg-teal-600 rounded-2xl p-5 shadow-sm text-white">
            <p className="text-xs font-bold text-teal-100 uppercase tracking-wider mb-2">Next Audition</p>
            <h3 className="text-lg font-bold mb-1">{nextEvent.name}</h3>
            <p className="text-sm text-teal-50 flex items-center gap-1.5 mb-4">
              <Clock className="w-3.5 h-3.5" /> {format(new Date(nextEvent.date), "MMMM d, yyyy")}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {[...Array(Math.min(3, nextEvent.sessions.reduce((acc: number, s: any) => acc + s.applicants.length, 0)))].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-teal-600 bg-white text-teal-600 flex items-center justify-center font-bold text-[10px]">
                    ??
                  </div>
                ))}
              </div>
              <Button size="icon" className="w-8 h-8 rounded-full bg-teal-800 hover:bg-teal-900 border-none">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "All Upcoming Events"}
            </h2>
            {selectedDate && (
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(undefined)} className="h-8 text-xs font-bold rounded-full">
                Clear Filter
              </Button>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden h-8 text-xs font-bold rounded-full">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {selectedDate ? format(selectedDate, "Change Date") : "Filter Date"}
                </Button>
              </DialogTrigger>
              <DialogContent className="w-fit p-4 rounded-2xl">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md mx-auto"
                  classNames={{
                    day_selected: "bg-[#E87154] text-white hover:bg-[#E87154] hover:text-white focus:bg-[#E87154] focus:text-white",
                    day_today: "bg-slate-100 text-slate-900"
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#E87154] hover:bg-[#D66144] rounded-full px-6 shadow-sm"><Plus className="w-4 h-4 mr-2" /> Create Event</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl">Create New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Event Name</Label>
                  <Input value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} placeholder="e.g. Accra Auditions" className="rounded-lg bg-slate-50 border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="rounded-lg bg-slate-50 border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label>Venue</Label>
                  <Input value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} placeholder="e.g. East Legon Office" className="rounded-lg bg-slate-50 border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label>Max Capacity</Label>
                  <Input type="number" value={newEvent.maxCapacity} onChange={e => setNewEvent({...newEvent, maxCapacity: e.target.value})} placeholder="Optional" className="rounded-lg bg-slate-50 border-slate-200" />
                </div>
                <Button onClick={handleCreateEvent} disabled={isCreatingEvent || !newEvent.name || !newEvent.date || !newEvent.venue} className="w-full bg-[#E87154] hover:bg-[#D66144] rounded-lg h-10">
                  {isCreatingEvent ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Event"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Schedule View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-12">
          {displayedEvents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Calendar className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium text-slate-500">No events scheduled for this date.</p>
            </div>
          ) : (
            displayedEvents.map((event, eventIdx) => (
              <div key={event.id} className="relative border-b border-slate-100 pb-8 last:border-0">
                {/* Event Header Timeline Marker */}
                <div className="flex flex-col sm:flex-row sm:items-start md:items-center gap-4 mb-6 sticky top-0 bg-white z-10 py-3 border-b sm:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 sm:w-16 text-center sm:text-right bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-xl shrink-0">
                      <p className="text-xs sm:text-sm font-bold text-[#E87154] uppercase tracking-wider">{format(new Date(event.date), "EEE")}</p>
                      <p className="text-xl sm:text-2xl font-black text-slate-900 sm:text-slate-400 sm:font-light -mt-1">{format(new Date(event.date), "dd")}</p>
                    </div>
                    <div className="w-px h-12 bg-slate-200 mx-2 hidden sm:block" />
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">{event.name}</h3>
                      <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#E87154]" /> {event.venue}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 flex-1 w-full sm:w-auto">
                    {/* Released Status Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${event.isReleased 
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                      : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                      {event.isReleased ? (
                        <>
                          <Unlock className="w-3 h-3" />
                          <span>Released</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Not Released</span>
                        </>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleReleaseSlots(event.id, !event.isReleased)}
                        disabled={releasingEventId === event.id}
                        className={event.isReleased 
                          ? "border-amber-300 text-amber-700 hover:bg-amber-50 h-8 text-xs font-bold" 
                          : "border-emerald-300 text-emerald-700 hover:bg-emerald-50 h-8 text-xs font-bold"}
                      >
                        {releasingEventId === event.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : event.isReleased ? (
                          <>
                            <Lock className="w-3.5 h-3.5 mr-1" />
                            Close Booking
                          </>
                        ) : (
                          <>
                            <Megaphone className="w-3.5 h-3.5 mr-1" />
                            Release Slots
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Event Sessions Container */}
                <div className="pl-0 sm:pl-[104px] space-y-4">
                  {/* Add Session Form inline block */}
                  <div className="bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-4 w-full sm:w-[90%] md:w-3/4 lg:w-1/2">
                    <form onSubmit={(e) => handleCreateSession(event.id, e)} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                      <div className="flex gap-3 flex-1">
                        <div className="space-y-1 flex-1">
                          <Label className="text-[11px] font-bold uppercase text-slate-400">Start</Label>
                          <Input name="startTime" type="time" required className="h-9 bg-white border-slate-200 rounded-lg text-sm w-full" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <Label className="text-[11px] font-bold uppercase text-slate-400">End</Label>
                          <Input name="endTime" type="time" required className="h-9 bg-white border-slate-200 rounded-lg text-sm w-full" />
                        </div>
                      </div>
                      <div className="flex gap-3 items-end">
                        <div className="space-y-1 w-20">
                          <Label className="text-[11px] font-bold uppercase text-slate-400">Cap (Opt)</Label>
                          <Input name="capacity" type="number" className="h-9 bg-white border-slate-200 rounded-lg text-sm w-full" />
                        </div>
                        <Button type="submit" size="sm" variant="secondary" className="h-9 rounded-lg px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold shrink-0">Add Slot</Button>
                      </div>
                    </form>
                  </div>

                  {event.sessions.map((session: any, sessionIdx: number) => {
                    const color = PASTEL_COLORS[(eventIdx + sessionIdx) % PASTEL_COLORS.length];
                    return (
                      <div key={session.id} className={`${color.bg} ${color.border} border rounded-2xl p-4 sm:p-5 shadow-sm transition-transform hover:scale-[1.01] w-full sm:w-[90%]`}>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                          <div>
                            <h4 className={`text-base font-bold ${color.text}`}>
                              {format(new Date(session.startTime), "h:mm a")} – {format(new Date(session.endTime), "h:mm a")}
                            </h4>
                            <p className={`text-xs font-medium opacity-80 ${color.text} mt-0.5 flex items-center gap-1`}>
                              <Video className="w-3.5 h-3.5" /> Audition Slot
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 bg-white/50 px-3 py-1.5 rounded-2xl sm:rounded-full border border-white/20 w-fit">
                            <Users className={`w-3.5 h-3.5 ${color.text}`} />
                            <span className={`text-xs font-bold ${color.text}`}>
                              {session.applicants.length}/1 Assigned
                            </span>
                            {session.applicants.length < 1 && (
                              <>
                                <div className="hidden sm:block w-px h-3 bg-white/50 mx-1" />
                                <AddApplicantToSessionDialog 
                                  sessionId={session.id} 
                                  sessionName={`${format(new Date(session.startTime), "h:mm a")} - ${format(new Date(session.endTime), "h:mm a")}`} 
                                  onAssignComplete={loadEvents}
                                />
                              </>
                            )}
                          </div>
                        </div>

                        {/* Applicants in this session */}
                        {session.applicants.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2 animate-in fade-in duration-200">
                            {session.applicants.map((app: any) => (
                              <div key={app.applicantId} className="flex items-center gap-1.5 bg-white border border-white/40 shadow-sm rounded-full py-1 pr-2.5 pl-1.5">
                                <button 
                                  onClick={() => openScoreModal(app, session.id)}
                                  className="flex items-center gap-2 hover:opacity-85 transition-opacity text-left cursor-pointer"
                                  title="Score Performance"
                                >
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${color.bg} ${color.text}`}>
                                    {getInitials(app.fullName)}
                                  </div>
                                  <span className="text-xs font-bold text-slate-700 hover:text-slate-900">{app.fullName}</span>
                                </button>
                                <div className="w-px h-3.5 bg-slate-200 mx-0.5" />
                                <AssignSessionDialog 
                                  applicantId={app.applicantId} 
                                  currentSessionId={session.id} 
                                  currentStatus={app.status}
                                  compact={true}
                                  onAssignComplete={loadEvents}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SCORE MODAL REDESIGN */}
      <Dialog open={isScoreModalOpen} onOpenChange={setIsScoreModalOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-slate-50">
          {/* Header Area */}
          <div className="bg-[#1A1A1A] p-8 text-white relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <h2 className="text-3xl font-black tracking-tight mb-2">Score Applicant</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E87154] flex items-center justify-center font-bold text-sm shadow-inner">
                {scoringApplicant && getInitials(scoringApplicant.fullName)}
              </div>
              <div>
                <p className="text-lg font-bold text-white">{scoringApplicant?.fullName}</p>
                <p className="text-xs font-medium text-slate-400 font-mono">{scoringApplicant?.applicantId}</p>
              </div>
            </div>
          </div>

          <div className="p-8 max-h-[70vh] overflow-y-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-8">
              
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <Checkbox 
                  id="attended" 
                  checked={scoreData.attended}
                  onCheckedChange={(c) => setScoreData({...scoreData, attended: c === true})}
                  className="w-5 h-5 rounded data-[state=checked]:bg-[#E87154] data-[state=checked]:border-[#E87154]"
                />
                <Label htmlFor="attended" className="text-base font-bold text-slate-900 cursor-pointer">Applicant Attended Audition</Label>
              </div>

              {scoreData.attended && (
                <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
                  
                  <div className="space-y-3 border-b border-slate-100 pb-8">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Evaluator Profile</Label>
                    <Input 
                      value={scoreData.evaluatorName} 
                      onChange={e => setScoreData({...scoreData, evaluatorName: e.target.value})} 
                      placeholder="Enter your name" 
                      className="h-12 bg-slate-50 border-slate-200 rounded-xl font-medium"
                    />
                  </div>

                  <div className="space-y-6">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">Performance Criteria</Label>
                    <div className="grid gap-x-12 gap-y-6">
                      <ScoreRow label="Reading Ability" value={scoreData.readingAbility} onChange={v => setScoreData({...scoreData, readingAbility: v})} />
                      <ScoreRow label="Storytelling Ability" value={scoreData.storytellingAbility} onChange={v => setScoreData({...scoreData, storytellingAbility: v})} />
                      <ScoreRow label="Child Engagement" value={scoreData.childEngagement} onChange={v => setScoreData({...scoreData, childEngagement: v})} />
                      <ScoreRow label="Communication Skills" value={scoreData.communicationSkills} onChange={v => setScoreData({...scoreData, communicationSkills: v})} />
                      <ScoreRow label="Confidence" value={scoreData.confidence} onChange={v => setScoreData({...scoreData, confidence: v})} />
                      <ScoreRow label="Improvisation" value={scoreData.improvisation} onChange={v => setScoreData({...scoreData, improvisation: v})} />
                    </div>
                  </div>

                  <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <Label className="text-sm font-black uppercase tracking-widest text-orange-900">Overall Recommendation</Label>
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                        {[1,2,3,4,5,6,7,8,9,10].map(v => (
                          <button 
                            key={v}
                            type="button"
                            onClick={() => setScoreData({...scoreData, overallRecommendation: v})}
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full text-base sm:text-lg font-black transition-all ${scoreData.overallRecommendation >= v ? 'bg-[#E87154] text-white shadow-md transform -translate-y-1' : 'bg-white text-orange-300 border border-orange-200 hover:bg-orange-100'}`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Additional Feedback</Label>
                    <Textarea 
                      value={scoreData.evaluatorNotes} 
                      onChange={e => setScoreData({...scoreData, evaluatorNotes: e.target.value})} 
                      placeholder="Detailed feedback or comments regarding the audition performance..." 
                      className="min-h-[120px] resize-none bg-slate-50 border-slate-200 rounded-xl" 
                    />
                  </div>
                  
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6 bg-white border-t border-slate-200 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsScoreModalOpen(false)} className="rounded-xl font-bold text-slate-500 hover:text-slate-900">Cancel</Button>
            <Button 
              onClick={handleSubmitScore} 
              disabled={isSubmittingScore || (scoreData.attended && !scoreData.evaluatorName)} 
              className="bg-[#E87154] hover:bg-[#D66144] rounded-xl px-8 shadow-md"
            >
              {isSubmittingScore ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Final Score
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
