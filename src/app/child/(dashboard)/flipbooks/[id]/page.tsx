import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getChildSession } from "@/lib/child-auth";
import { trackReadingProgress } from "@/app/actions/child-flipbooks";
import Link from "next/link";
import { ArrowLeft, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isFlipbookReadableForChild } from "@/lib/access-control.mjs";

export default async function ChildFlipbookPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getChildSession();
  if (!session) {
    redirect("/child/login");
  }

  const flipbook = await prisma.flipbook.findUnique({
    where: { id: params.id },
  });

  if (!flipbook) {
    notFound();
  }

  const child = await prisma.childProfile.findUnique({
    where: { id: session.childId },
    include: {
      subscriptions: {
        where: {
          endDate: { gte: new Date() },
          status: "ACTIVE",
        },
      },
    },
  });

  if (!child || !isFlipbookReadableForChild({
    isFree: flipbook.isFree,
    childHasSubscription: child.subscriptions.length > 0,
    flipbookAgeGroup: flipbook.ageGroup,
    childAgeGroup: child.ageGroup,
  })) {
    redirect("/child");
  }

  await trackReadingProgress(params.id);

  return (
    <div className="min-h-screen bg-[#FFFAF5] font-quicksand flex flex-col selection:bg-[#E87154]/20">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-[#E87154]/10 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/child">
            <Button variant="ghost" className="text-[#BBBBBB] hover:text-[#E87154] hover:bg-[#E87154]/5 rounded-xl font-black uppercase tracking-widest text-xs gap-2">
              <ArrowLeft className="h-5 w-5" />
              Back to Library
            </Button>
          </Link>
          
          <div className="flex-1 text-center px-4">
            <h1 className="text-2xl font-black text-[#2D2D2D] truncate max-w-xl mx-auto">
              {flipbook.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-[#BBBBBB] hover:text-[#E87154] hover:bg-[#E87154]/5 rounded-xl transition-all">
              <Maximize2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-[-5%] w-96 h-96 bg-[#E87154]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-20 left-[-5%] w-96 h-96 bg-[#E87154]/3 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-6xl aspect-[4/3] bg-white rounded-[40px] shadow-[0_30px_80px_rgba(232,113,84,0.15)] overflow-hidden border-8 border-white relative z-10">
          {flipbook.heyzineUrl ? (
            <iframe
              src={flipbook.heyzineUrl}
              className="w-full h-full border-0"
              allowFullScreen
            />
          ) : flipbook.pdfUrl ? (
            <iframe
              src={`${flipbook.pdfUrl}#toolbar=0`}
              className="w-full h-full border-0"
              allowFullScreen
            />
          ) : flipbook.iframeContent ? (
            <div 
              className="w-full h-full flex items-center justify-center bg-white"
              dangerouslySetInnerHTML={{ __html: flipbook.iframeContent }} 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#FFFAF5] p-12 text-center">
              <div className="w-24 h-24 bg-[#E87154]/10 rounded-full flex items-center justify-center mb-6 text-5xl">📚</div>
              <h2 className="text-3xl font-black text-[#2D2D2D] mb-4 font-quicksand">This book is taking a nap!</h2>
              <p className="text-[#6D6D6D] font-medium text-lg max-w-md">The magical pages are still being prepared. Check back in a little bit!</p>
              <Link href="/child" className="mt-8">
                <Button className="bg-[#E87154] hover:bg-[#D65D41] text-white rounded-2xl h-14 px-8 font-black text-lg shadow-lg">
                  Go Back
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
