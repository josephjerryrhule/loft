"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, UserPlus, Search, CheckCircle } from "lucide-react";
import { getRecruitmentApplicants, assignApplicantToSession, updateApplicantStatus } from "@/app/actions/recruitment";

export function AddApplicantToSessionDialog({
  sessionId,
  sessionName,
  onAssignComplete,
}: {
  sessionId: string;
  sessionName: string;
  onAssignComplete?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    
    const timeoutId = setTimeout(() => {
      setIsSearching(true);
      getRecruitmentApplicants({ search: searchQuery, pageSize: 5 }).then((res) => {
        if (res.applicants) {
          setSearchResults(res.applicants);
        }
        setIsSearching(false);
      }).catch((err) => {
        console.error(err);
        setIsSearching(false);
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, open]);

  const handleAssign = async () => {
    if (!selectedApplicant) return;
    
    setIsSubmitting(true);
    try {
      const res = await assignApplicantToSession(selectedApplicant.applicantId, sessionId);
      if (res && 'error' in res && res.error) {
        alert(res.error);
        return;
      }
      
      // Optionally prompt or auto-update status to AUDITION_INVITED
      if (selectedApplicant.status !== "AUDITION_INVITED" && selectedApplicant.status !== "AUDITION_CONFIRMED") {
        await updateApplicantStatus(selectedApplicant.applicantId, "AUDITION_INVITED", "Assigned to an audition session.");
      }
      
      setOpen(false);
      setSelectedApplicant(null);
      setSearchQuery("");
      if (onAssignComplete) onAssignComplete();
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
          <UserPlus className="w-3 h-3 mr-1" /> Add Applicant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white shadow-xl border border-slate-100">
        <DialogHeader>
          <DialogTitle>Assign to {sessionName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search by name, email, or ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
              )}
            </div>

            <div className="max-h-[200px] overflow-y-auto border rounded-md divide-y divide-slate-100">
              {searchResults.length === 0 && !isSearching ? (
                <div className="p-4 text-center text-sm text-slate-500 italic">
                  No applicants found.
                </div>
              ) : (
                searchResults.map((app) => (
                  <div 
                    key={app.applicantId}
                    onClick={() => setSelectedApplicant(app)}
                    className={`p-3 cursor-pointer hover:bg-slate-50 flex items-center justify-between ${
                      selectedApplicant?.applicantId === app.applicantId ? "bg-purple-50 border-l-2 border-l-[#E87154]" : ""
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900">{app.fullName}</p>
                      <p className="text-xs text-slate-500">{app.applicantId} • {app.status.replace(/_/g, " ")}</p>
                    </div>
                    {selectedApplicant?.applicantId === app.applicantId && (
                      <CheckCircle className="h-5 w-5 text-[#E87154]" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          
          <Button 
            onClick={handleAssign} 
            disabled={isSubmitting || !selectedApplicant} 
            className="w-full bg-[#E87154] hover:bg-[#D66144]"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
            Assign {selectedApplicant ? selectedApplicant.fullName : "Applicant"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
