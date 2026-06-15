"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { BookOpen, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { getApplicantPortalData } from "@/app/actions/recruitment";

export default function PortalLoginPage() {
  const [applicantId, setApplicantId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantId.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await getApplicantPortalData(applicantId.trim().toUpperCase());
      if (res.success) {
        router.push(`/recruitment/portal/${applicantId.trim().toUpperCase()}`);
      } else {
        setError(res.error || "Invalid Applicant ID.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen -mt-28 pt-28 pb-20 px-4 flex items-center justify-center bg-slate-50">
      <Card className="max-w-md w-full border-slate-200 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-[#4B2E83] text-white text-center py-8">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-black">Applicant Portal</CardTitle>
          <CardDescription className="text-purple-200 mt-2">
            Enter your Applicant ID to access the Facilitator Preparation Library and book your audition.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="applicantId">Applicant ID</Label>
              <Input
                id="applicantId"
                placeholder="e.g. LOFT-RC-260615-001"
                value={applicantId}
                onChange={(e) => setApplicantId(e.target.value)}
                className="h-12 rounded-xl text-lg tracking-wide uppercase"
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !applicantId.trim()}
              className="w-full h-14 rounded-xl font-bold bg-[#E87154] hover:bg-[#D66144] text-white shadow-md shadow-[#E87154]/20 gap-2 text-base"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
              ) : (
                <>Access Portal <ArrowRight className="w-5 h-5" /></>
              )}
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Don't have an ID? <Link href="/recruitment/apply" className="text-[#E87154] font-bold hover:underline">Apply Now</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
