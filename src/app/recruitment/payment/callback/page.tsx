import { verifyRecruitmentPayment } from "@/app/actions/recruitment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CheckCircle2, XCircle, ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const reference = (resolvedParams.reference || resolvedParams.trxref) as string | undefined;

  if (!reference) {
    redirect("/recruitment");
  }

  const result = await verifyRecruitmentPayment(reference);

  return (
    <div className="py-20 px-4 flex justify-center">
      <Card className="max-w-md w-full border-slate-200 shadow-xl rounded-2xl overflow-hidden">
        {result.success ? (
          <>
            <div className="bg-green-50 p-8 flex flex-col items-center text-center border-b border-green-100">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-black text-green-900 mb-2">Payment Successful!</h1>
              <p className="text-green-700 font-medium">
                Your application fee has been processed.
              </p>
            </div>
            
            <CardContent className="p-8 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl text-center space-y-2 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Application ID</p>
                <p className="text-xl font-mono font-bold text-slate-900">
                  {result.applicantId || "Processing..."}
                </p>
              </div>
              
              <div className="text-center space-y-3 text-sm text-slate-600">
                <p>
                  Your application to become a LOFT Reading Club Facilitator has been officially submitted and is now under review.
                </p>
                <p>
                  We have sent a confirmation email to the address you provided. If shortlisted, you will be invited to attend an audition.
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="p-8 pt-0 bg-white">
              <Link href="/recruitment" className="w-full">
                <Button className="w-full h-14 rounded-xl font-bold bg-[#E87154] hover:bg-[#D66144] text-white shadow-md shadow-[#E87154]/20 gap-2">
                  <BookOpen className="w-5 h-5" />
                  Return to Home
                </Button>
              </Link>
            </CardFooter>
          </>
        ) : (
          <>
            <div className="bg-red-50 p-8 flex flex-col items-center text-center border-b border-red-100">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-black text-red-900 mb-2">Payment Failed</h1>
              <p className="text-red-700 font-medium">
                {result.error || "We couldn't verify your payment."}
              </p>
            </div>
            
            <CardContent className="p-8">
              <p className="text-center text-sm text-slate-600">
                Don't worry, your application data is saved. You can try completing your payment again using your Application ID on the recruitment home page.
              </p>
            </CardContent>
            
            <CardFooter className="p-8 pt-0 bg-white flex flex-col gap-3">
              <Link href="/recruitment" className="w-full">
                <Button variant="outline" className="w-full h-14 rounded-xl font-bold border-slate-200">
                  Try Again Later
                </Button>
              </Link>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
