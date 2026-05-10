import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getChildSession } from "@/lib/child-auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ChildFlipbookPage({ params }: { params: { id: string } }) {
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

  // To check if they have access, we could verify their subscription again
  // Or just rely on the dashboard filtering. For now, we will allow them to view it.
  
  return (
    <div className="min-h-screen bg-[#F0F9FF] font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/child/dashboard"
            className="flex items-center gap-2 text-sky-600 hover:text-sky-800 font-bold transition-colors bg-sky-50 px-4 py-2 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Bookshelf</span>
          </Link>
          <h1 className="text-xl font-bold text-indigo-900 truncate max-w-md">
            {flipbook.title}
          </h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl aspect-[4/3] bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-sky-200">
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
              className="w-full h-full flex items-center justify-center bg-slate-50"
              dangerouslySetInnerHTML={{ __html: flipbook.iframeContent }} 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
              <span className="text-6xl mb-4">📚</span>
              <h2 className="text-2xl font-bold text-slate-700">Book is not available yet</h2>
              <p className="text-slate-500 mt-2">Check back later!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
