"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CalendarPlus, Check } from "lucide-react";
import { getAuditionEvents, assignApplicantToSession, updateApplicantStatus } from "@/app/actions/recruitment";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function AssignSessionDialog({
  applicantId,
  currentSessionId,
  currentStatus,
}: {
  applicantId: string;
  currentSessionId?: string | null;
  currentStatus: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  
  const [selectedSessionId, setSelectedSessionId] = useState<string>(currentSessionId || "");
  const [updateToInvited, setUpdateToInvited] = useState(currentStatus !== "AUDITION_INVITED" && currentStatus !== "AUDITION_CONFIRMED");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && events.length === 0) {
      setLoadingEvents(true);
      getAuditionEvents().then((res) => {
        if (res.events) setEvents(res.events);
        setLoadingEvents(false);
      }).catch((err) => {
        console.error(err);
        setLoadingEvents(false);
      });
    }
  }, [open, events.length]);

  const handleAssign = async () => {
    if (!selectedSessionId) return;
    
    setIsSubmitting(true);
    try {
      await assignApplicantToSession(applicantId, selectedSessionId);
      
      if (updateToInvited) {
        await updateApplicantStatus(applicantId, "AUDITION_INVITED", "Assigned to an audition session.");
      }
      
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs font-bold border-purple-200 text-purple-700 hover:bg-purple-50">
          <CalendarPlus className="w-3 h-3 mr-1" />
          {currentSessionId ? "Change Session" : "Assign to Session"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{currentSessionId ? "Change Audition Session" : "Assign to Audition Session"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label>Select Event & Time Slot</Label>
            {loadingEvents ? (
              <div className="h-10 flex items-center justify-center border rounded-md border-slate-200 bg-slate-50">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-sm text-slate-500 italic p-3 border rounded-md bg-slate-50">
                No upcoming audition events found.
              </div>
            ) : (
              <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a time slot..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {events.map((event) => (
                    event.sessions.length > 0 && (
                      <SelectGroup key={event.id}>
                        <SelectLabel className="font-bold text-[#E87154] bg-slate-50">
                          {event.name} ({format(new Date(event.date), "MMM d, yyyy")})
                        </SelectLabel>
                        {event.sessions.map((session: any) => {
                          const isFull = session.maxCapacity && session._count.applicants >= session.maxCapacity;
                          return (
                            <SelectItem 
                              key={session.id} 
                              value={session.id}
                              disabled={isFull && session.id !== currentSessionId}
                            >
                              <div className="flex justify-between items-center w-full min-w-[200px]">
                                <span>{format(new Date(session.startTime), "h:mm a")} - {format(new Date(session.endTime), "h:mm a")}</span>
                                <span className={`text-xs ml-4 ${isFull ? "text-red-500 font-bold" : "text-slate-400"}`}>
                                  ({session._count.applicants}{session.maxCapacity ? `/${session.maxCapacity}` : ""})
                                  {isFull && session.id !== currentSessionId && " FULL"}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectGroup>
                    )
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {(currentStatus !== "AUDITION_INVITED" && currentStatus !== "AUDITION_CONFIRMED") && (
            <div className="flex items-center space-x-2 bg-purple-50 p-3 rounded-lg border border-purple-100">
              <Checkbox 
                id="auto-update" 
                checked={updateToInvited}
                onCheckedChange={(c) => setUpdateToInvited(c === true)}
              />
              <Label htmlFor="auto-update" className="text-sm font-medium leading-none cursor-pointer text-purple-900">
                Also update status to "Audition Invited" and send email
              </Label>
            </div>
          )}
          
          <Button 
            onClick={handleAssign} 
            disabled={isSubmitting || !selectedSessionId || (selectedSessionId === currentSessionId)} 
            className="w-full bg-[#E87154] hover:bg-[#D66144]"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            Confirm Assignment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
