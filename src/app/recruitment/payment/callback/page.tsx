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
              <h1 className="text-2xl font-black text-green-900 mb-2 uppercase tracking-wide">Application Received</h1>
              <p className="text-green-700 font-medium">
                Thank you for completing your LOFT Confidence Program Facilitator Application. Your application and payment have been received successfully.
              </p>
            </div>
            
            <CardContent className="p-8 space-y-6">
              <div className="bg-[#4B2E83]/10 border border-[#4B2E83]/20 p-6 rounded-xl text-center space-y-2">
                <p className="text-xs font-bold text-[#4B2E83] uppercase tracking-widest">Your Applicant ID is:</p>
                <p className="text-3xl font-mono font-black text-[#4B2E83]">
                  {result.applicantId || "Processing..."}
                </p>
                <p className="text-xs text-slate-500 font-medium pt-2">Please keep this Applicant ID safe, as it will be used throughout the recruitment process and to access your Facilitator Preparation Library.</p>
              </div>
              
              <div className="space-y-4 text-sm text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="font-bold text-slate-900 text-base uppercase tracking-wider">What Happens Next?</h3>
                <p>
                  The next stage of the recruitment process is a physical audition.
                </p>
                <p>
                  We are currently finalizing audition dates and schedules. Auditions are expected to take place in August; however, it is very possible that auditions may begin sooner than that.
                </p>
                <p>
                  For this reason, we encourage you to begin preparing immediately and remain attentive to all communications from the LOFT team.
                </p>
                <p>
                  As soon as audition slots become available, we will notify you via both email and WhatsApp using the contact information you provided. Once notified, you will be able to return to the recruitment portal and book your preferred audition slot from the available options.
                </p>
                <p className="font-medium text-slate-900">
                  Please keep an eye on your email and WhatsApp messages and be ready when booking opens.
                </p>
              </div>

              <div className="space-y-4 text-sm text-slate-700 leading-relaxed bg-orange-50 p-6 rounded-xl border border-orange-100">
                <h3 className="font-bold text-orange-900 text-base uppercase tracking-wider">Facilitator Preparation Library</h3>
                <p className="text-orange-800">
                  To help you prepare, your Applicant ID has unlocked complimentary access to the LOFT Facilitator Preparation Library for one month.
                </p>
                <div className="text-orange-800">
                  We strongly encourage you to:
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Read the books available in the library</li>
                    <li>Become familiar with the LOFT reading experience</li>
                    <li>Explore the LOFT platform</li>
                    <li>Learn more about the LOFT brand and mission</li>
                    <li>Practice reading aloud, storytelling, and voice acting</li>
                  </ul>
                </div>
                <p className="text-orange-800 font-medium italic pt-2">
                  Please note that books and materials from the Preparation Library may be used during the audition process.
                </p>
              </div>

              <div className="space-y-4 text-sm text-slate-700 leading-relaxed bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-900 text-base uppercase tracking-wider">Stay Connected</h3>
                <p className="text-blue-800">
                  We also encourage you to follow LOFT on all our social media platforms to stay updated on announcements, activities, important recruitment updates, and opportunities within the LOFT community.
                </p>
                <div className="flex gap-4 pt-2">
                  <a href="https://instagram.com/landoffairytales" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold">Instagram</a>
                  <a href="https://twitter.com/loft_kids" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold">X (Twitter)</a>
                  <a href="https://linkedin.com/company/landoffairytales" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold">LinkedIn</a>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
                <div className="bg-slate-100 p-6 rounded-xl text-center sm:text-left">
                  <h3 className="font-bold text-slate-900 text-base uppercase tracking-wider mb-2">Need Help?</h3>
                  <p className="mb-3">If you have any questions, concerns, or require assistance at any stage of the recruitment process, please feel free to reach out to us. Our team will be happy to assist you.</p>
                  <div className="space-y-1 text-sm font-medium">
                    <p>Email: <a href="mailto:hello@landoffairytales.com" className="text-[#E87154] hover:underline">hello@landoffairytales.com</a></p>
                    <p>WhatsApp / Phone: <a href="tel:0559922299" className="text-[#E87154] hover:underline">0559922299</a></p>
                  </div>
                  <p className="mt-3">Please don't hesitate to contact us if you need clarification or support.</p>
                </div>
                <div className="text-center sm:text-left mt-6">
                  <p>Thank you again for your interest in becoming a LOFT Confidence Program Facilitator.</p>
                  <p className="mt-1">We look forward to meeting you at the auditions.</p>
                  <p className="mt-4 font-bold">The LOFT Team</p>
                </div>
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
