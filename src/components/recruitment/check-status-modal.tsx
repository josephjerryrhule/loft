"use client";

import { useState } from "react";
import { Search, Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { lookupApplicationStatus } from "@/app/actions/recruitment";

type StatusResult = {
  applicantId: string;
  fullName: string;
  status: string;
  paymentStatus: string;
  submittedAt: string;
  paidAt: string | null;
};

export function CheckStatusModal({
  triggerButton
}: {
  triggerButton?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [statusResult, setStatusResult] = useState<StatusResult | null>(null);

  const handleLookup = async () => {
    if (!applicationId.trim()) {
      setLookupError("Please enter your Application ID");
      return;
    }
    setLookupLoading(true);
    setLookupError("");
    setStatusResult(null);

    try {
      const result = await lookupApplicationStatus(applicationId.trim());
      if (result.success && result.data) {
        setStatusResult(result.data);
      } else {
        setLookupError(result.error || "Application not found. Please check your ID.");
      }
    } catch {
      setLookupError("Something went wrong. Please try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING_PAYMENT": return "bg-orange-100 text-orange-700 border-orange-200";
      case "APPLICATION_SUBMITTED": return "bg-blue-100 text-blue-700 border-blue-200";
      case "AUDITION_INVITED": return "bg-purple-100 text-purple-700 border-purple-200";
      case "HIRED": return "bg-green-100 text-green-700 border-green-200";
      case "REJECTED": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline">Check Status</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="text-center pb-4 pt-8 px-8 border-b border-slate-100 bg-slate-50/50">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white border border-slate-200 shadow-sm rounded-2xl mx-auto mb-4">
            <Search className="h-6 w-6 text-slate-600" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900 text-center">
            Check Your Status
          </DialogTitle>
          <p className="text-sm text-slate-500 font-medium text-center">
            Already applied? Enter your Application ID below.
          </p>
        </DialogHeader>

        <div className="p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="applicationId" className="text-sm font-bold text-slate-700 ml-1">
              Application ID
            </Label>
            <Input
              id="applicationId"
              placeholder="LOFT-RC-XXXXXX-XXXX"
              value={applicationId}
              onChange={(e) => {
                setApplicationId(e.target.value.toUpperCase());
                setLookupError("");
                setStatusResult(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLookup();
              }}
              className="h-14 rounded-2xl text-center font-mono text-base tracking-widest border-slate-300 focus:border-[#E87154] focus:ring-[#E87154]/10 shadow-sm"
            />
            {lookupError && (
              <p className="text-sm font-medium text-red-500 flex items-center justify-center gap-1.5 mt-2">
                <AlertCircle className="h-4 w-4" /> {lookupError}
              </p>
            )}
          </div>

          <Button 
            onClick={handleLookup} 
            disabled={lookupLoading || !applicationId.trim()}
            className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-md transition-all active:scale-[0.98]"
          >
            {lookupLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "View Status"}
          </Button>

          {statusResult && (
            <div className="mt-8 border border-slate-200 rounded-2xl bg-slate-50/50 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{statusResult.fullName}</h3>
                    <p className="text-xs font-mono text-slate-500 mt-1">{statusResult.applicantId}</p>
                  </div>
                  <Badge variant="outline" className={`px-3 py-1 text-xs font-bold ${getStatusColor(statusResult.status)}`}>
                    {formatStatus(statusResult.status)}
                  </Badge>
                </div>

                <Separator className="my-4 bg-slate-200" />

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Applied On</span>
                    <span className="font-semibold text-slate-700">
                      {new Date(statusResult.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Payment Status</span>
                    {statusResult.paymentStatus === 'PAID' ? (
                      <span className="flex items-center gap-1.5 font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                        <CheckCircle className="w-3.5 h-3.5" /> Paid
                      </span>
                    ) : (
                      <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {statusResult.status === "PENDING_PAYMENT" && (
                <div className="bg-orange-50 p-5 border-t border-orange-100 flex flex-col gap-3">
                  <p className="text-sm font-medium text-orange-800 text-center">
                    Your application requires a GHC 100 assessment fee to proceed.
                  </p>
                  <Button 
                    asChild
                    className="w-full bg-[#E87154] hover:bg-[#D66144] text-white font-bold h-12 rounded-xl shadow-sm"
                  >
                    <a href={`/recruitment/payment?id=${statusResult.applicantId}`}>
                      Complete Payment <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </div>
              )}

              {statusResult.status === "APPLICATION_SUBMITTED" && (
                <div className="bg-blue-50 p-5 border-t border-blue-100 text-center">
                  <p className="text-sm font-medium text-blue-800">
                    We've received your application! We will review it and contact you with next steps.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
