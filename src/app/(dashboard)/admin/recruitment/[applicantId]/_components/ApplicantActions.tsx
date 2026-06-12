"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateApplicantStatus, addApplicantNote } from "@/app/actions/recruitment";
import { RECRUITMENT_STATUSES, RecruitmentStatus } from "@/lib/recruitment-constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MessageSquare, Settings } from "lucide-react";

export function ApplicantActions({
  applicantId,
  currentStatus,
  internalNotes,
}: {
  applicantId: string;
  currentStatus: string;
  internalNotes: string | null;
}) {
  const router = useRouter();
  
  const [status, setStatus] = useState<RecruitmentStatus>(currentStatus as RecruitmentStatus);
  const [statusNote, setStatusNote] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  const handleUpdateStatus = async () => {
    if (status === currentStatus) return;
    setIsUpdatingStatus(true);
    try {
      await updateApplicantStatus(applicantId, status, statusNote);
      setStatusNote("");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsAddingNote(true);
    try {
      await addApplicantNote(applicantId, newNote);
      setNewNote("");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3 border-b bg-slate-50">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4 text-slate-500" /> Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Update Status</p>
            <Select value={status} onValueChange={(val: RecruitmentStatus) => setStatus(val)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {RECRUITMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea 
              placeholder="Optional note about this status change..." 
              className="resize-none h-20 text-sm mt-2" 
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
            <Button 
              onClick={handleUpdateStatus} 
              disabled={isUpdatingStatus || status === currentStatus}
              className="w-full mt-2"
            >
              {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Status
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 border-b bg-slate-50">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-slate-500" /> Internal Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {internalNotes ? (
            <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100 max-h-[300px] overflow-y-auto">
              <p className="text-sm font-mono whitespace-pre-wrap text-slate-700 leading-relaxed">{internalNotes}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">No internal notes yet.</p>
          )}
          
          <div className="space-y-2 pt-2 border-t">
            <Textarea 
              placeholder="Add a new internal note..." 
              className="resize-none h-20 text-sm" 
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <Button 
              variant="outline"
              onClick={handleAddNote} 
              disabled={isAddingNote || !newNote.trim()}
              className="w-full"
            >
              {isAddingNote ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
