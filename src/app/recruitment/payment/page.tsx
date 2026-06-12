"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { lookupApplicationStatus, initializeRecruitmentPayment } from "@/app/actions/recruitment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, DollarSign, CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function PaymentContent() {
  const searchParams = useSearchParams();
  const applicantId = searchParams.get("id");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applicant, setApplicant] = useState<any>(null);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    if (!applicantId) {
      setError("No Application ID provided");
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const result = await lookupApplicationStatus(applicantId as string);
        if (result.success && result.data) {
          setApplicant(result.data);
        } else {
          setError(result.error || "Application not found");
        }
      } catch (err) {
        setError("Failed to verify application");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [applicantId]);

  const handlePayment = async () => {
    if (!applicantId) return;
    setInitializing(true);
    setError("");

    try {
      const result = await initializeRecruitmentPayment(applicantId as string);
      if (result.success && result.authorizationUrl) {
        window.location.href = result.authorizationUrl;
      } else {
        setError(result.error || "Failed to initialize payment");
        setInitializing(false);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setInitializing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#E87154] mb-4" />
        <p className="text-slate-500 font-medium">Verifying application...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto border-red-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="bg-red-50 p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-bold text-red-900 mb-2">Verification Failed</h2>
          <p className="text-sm text-red-700">{error}</p>
        </div>
        <CardFooter className="p-4 bg-white">
          <Button onClick={() => router.push("/recruitment")} variant="outline" className="w-full h-11 rounded-xl">
            Return Home
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (applicant?.status !== "PENDING_PAYMENT" && applicant?.paymentStatus === "PAID") {
    return (
      <Card className="max-w-md mx-auto border-green-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="bg-green-50 p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-green-900 mb-2">Payment Complete</h2>
          <p className="text-sm text-green-700 mb-4">
            Your application fee has already been paid.
          </p>
          <Badge className="bg-green-200 text-green-800 border-none font-mono tracking-wider">
            {applicant.applicantId}
          </Badge>
        </div>
        <CardFooter className="p-4 bg-white">
          <Button onClick={() => router.push("/recruitment")} variant="outline" className="w-full h-11 rounded-xl">
            Return Home
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto border-slate-200 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="bg-slate-50 border-b text-center pt-8 pb-6">
        <div className="w-16 h-16 bg-[#E87154]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <DollarSign className="h-8 w-8 text-[#E87154]" />
        </div>
        <CardTitle className="text-2xl font-black text-slate-900">Complete Application</CardTitle>
        <CardDescription className="text-slate-500 font-medium">
          Pay the application fee to submit your form
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-sm text-slate-500 font-medium">Applicant Name</span>
            <span className="text-sm font-bold text-slate-900">{applicant?.fullName}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-sm text-slate-500 font-medium">Application ID</span>
            <span className="text-sm font-bold font-mono text-slate-900">{applicant?.applicantId}</span>
          </div>
          <div className="flex justify-between items-center py-2 pt-3">
            <span className="text-base text-slate-700 font-bold">Total Amount</span>
            <span className="text-xl font-black text-[#E87154]">GHC 100.00</span>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-800 text-xs font-medium">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <p>
            This fee covers application processing and assessment materials. It is non-refundable regardless of the outcome of your application.
          </p>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex flex-col gap-3">
        <Button 
          onClick={handlePayment} 
          disabled={initializing}
          className="w-full h-14 rounded-xl font-bold bg-[#E87154] hover:bg-[#D66144] text-white text-lg shadow-md shadow-[#E87154]/20"
        >
          {initializing ? (
            <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Initializing...</>
          ) : (
            "Pay GHC 100 Now"
          )}
        </Button>
        <p className="text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-1">
          Secured by <span className="font-bold text-slate-600">Paystack</span>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function PaymentPage() {
  return (
    <div className="py-12 px-4">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#E87154] mb-4" />
        </div>
      }>
        <PaymentContent />
      </Suspense>
    </div>
  );
}
