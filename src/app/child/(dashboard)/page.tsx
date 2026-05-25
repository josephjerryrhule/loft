import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/child-auth";

// Always fetch fresh data — stats and "Continue Reading" must reflect the latest reading activity
export const dynamic = "force-dynamic";
import { getChildFlipbooks } from "@/app/actions/child-flipbooks";
import { Bookshelf } from "@/components/child/Bookshelf";
import { BookOpen, Trophy, Star, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DynamicGreeting } from "@/components/child/DynamicGreeting";

export default async function ChildDashboardPage() {
  const session = await getChildSession();

  if (!session) {
    redirect("/child/login");
  }

  const { flipbooks, hasAccess, childName, stats, lastReadProgress, error } = await getChildFlipbooks();

  if (error || !flipbooks) {
    return (
      <div className="min-h-screen bg-[#FFFAF5] flex items-center justify-center">
        <div className="bg-white p-12 rounded-[40px] shadow-[0_20px_60px_rgba(232,113,84,0.1)] text-center max-w-md border border-[#E87154]/10">
          <div className="w-20 h-20 bg-[#E87154]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">📚</div>
          <h1 className="text-3xl font-black text-[#2D2D2D] mb-4 font-quicksand">Oops!</h1>
          <p className="text-[#6D6D6D] font-medium leading-relaxed">Something went wrong while getting your books. Let's try again!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <DynamicGreeting />
          <h1 className="text-4xl sm:text-6xl font-black text-[#2D2D2D] font-quicksand tracking-tight">
            Hi, <span className="text-[#E87154]">{childName || session.username}</span>!
          </h1>
        </div>
        
        {/* Compact Stats Row */}
        <div className="flex items-center gap-4">
          <div className="bg-white px-6 py-3 rounded-2xl border border-[#E87154]/10 shadow-sm flex items-center gap-3">
             <div className="w-8 h-8 bg-[#E87154]/10 rounded-lg flex items-center justify-center text-[#E87154]">
               <Star className="w-4 h-4" fill="currentColor" />
             </div>
             <div className="flex flex-col">
               <span className="text-lg font-black leading-none text-[#2D2D2D]">{stats?.totalBooksRead || 0}</span>
               <span className="text-[8px] font-black text-[#BBBBBB] uppercase tracking-widest">Books</span>
             </div>
          </div>
          <div className="bg-[#E87154] px-6 py-3 rounded-2xl shadow-md flex items-center gap-3 text-white">
             <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
               <Trophy className="w-4 h-4" />
             </div>
             <div className="flex flex-col">
               <span className="text-lg font-black leading-none">{stats?.readingStreak || 0}</span>
               <span className="text-[8px] font-black text-white/70 uppercase tracking-widest">Streak</span>
             </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        {lastReadProgress ? (
          <div className="bg-white rounded-[40px] p-8 md:p-12 border border-[#E87154]/10 shadow-[0_20px_50px_rgba(232,113,84,0.08)] relative overflow-hidden group">
             {/* Decorative Background */}
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E87154]/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
             
             <div className="relative flex flex-col md:flex-row gap-10 items-center">
                <div className="w-48 md:w-64 aspect-[3/4] relative rounded-3xl overflow-hidden shadow-2xl transform group-hover:rotate-2 transition-transform duration-700">
                  <img 
                    src={lastReadProgress.coverImageUrl || "/images/book-placeholder.png"} 
                    alt={lastReadProgress.title} 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white/20 to-transparent"></div>
                </div>

                <div className="flex-1 space-y-8 text-center md:text-left w-full">
                  <div className="space-y-3">
                    <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#E87154]/10 text-[#E87154] text-xs font-black uppercase tracking-[0.2em]">
                      <Sparkles className="w-4 h-4" /> Continue Your Adventure
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-[#2D2D2D] font-quicksand leading-tight">
                      {lastReadProgress.title}
                    </h2>
                  </div>

                  {!lastReadProgress.isHeyzine ? (
                    <div className="space-y-6 max-w-md mx-auto md:mx-0">
                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-black text-[#BBBBBB] uppercase tracking-widest">Magic Meter</span>
                          <span className="text-sm font-black text-[#E87154]">{lastReadProgress.progress}% Explorer</span>
                        </div>
                        <div className="h-4 w-full bg-[#F5F5F5] rounded-full overflow-hidden border border-[#E87154]/5">
                          <div 
                            className="h-full bg-[#E87154] rounded-full shadow-[0_0_15px_rgba(232,113,84,0.3)] transition-all duration-1500"
 
                            style={{ width: `${lastReadProgress.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <Link href={`/child/flipbooks/${lastReadProgress.id}`} className="block">
                        <Button className="w-full md:w-auto h-16 px-12 bg-[#E87154] hover:bg-[#D65D41] text-white rounded-2xl font-black text-xl shadow-[0_15px_30px_rgba(232,113,84,0.3)] hover:shadow-[0_20px_40px_rgba(232,113,84,0.4)] transition-all flex items-center justify-center gap-3 transform hover:scale-105 active:scale-95">
                          Jump Back In! <ChevronRight className="w-7 h-7" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="max-w-md mx-auto md:mx-0">
                      <Link href={`/child/flipbooks/${lastReadProgress.id}`} className="block">
                        <Button className="w-full md:w-auto h-16 px-12 bg-[#E87154] hover:bg-[#D65D41] text-white rounded-2xl font-black text-xl shadow-[0_15px_30px_rgba(232,113,84,0.3)] hover:shadow-[0_20px_40px_rgba(232,113,84,0.4)] transition-all flex items-center justify-center gap-3 transform hover:scale-105 active:scale-95">
                          Read Again! <ChevronRight className="w-7 h-7" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
             </div>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] p-16 border border-[#E87154]/10 shadow-[0_10px_40px_rgba(232,113,84,0.05)] relative overflow-hidden flex flex-col items-center justify-center text-center space-y-8">
             <div className="w-32 h-32 bg-[#E87154]/10 rounded-full flex items-center justify-center text-6xl animate-bounce">✨</div>
             <div className="space-y-4">
               <h2 className="text-4xl font-black text-[#2D2D2D] font-quicksand tracking-tight">Ready for an Adventure?</h2>
               <p className="text-[#6D6D6D] font-medium text-xl max-w-md mx-auto leading-relaxed">
                 Pick your first magical book from the shelf below to start your journey!
               </p>
             </div>
          </div>
        )}
      </div>

      {/* Library Section */}
      <div className="space-y-12">
        <div className="flex items-center gap-4">
           <div className="h-px flex-1 bg-stone-100"></div>
           <h2 className="text-2xl font-black text-[#2D2D2D] font-quicksand uppercase tracking-[0.2em]">The Bookshelf</h2>
           <div className="h-px flex-1 bg-stone-100"></div>
        </div>
        <Bookshelf flipbooks={flipbooks} />
      </div>

      {!hasAccess && (
        <div className="bg-[#E87154] p-10 rounded-[40px] shadow-xl text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          <div className="relative flex flex-col sm:flex-row items-center gap-8">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl">🎁</div>
            <div className="space-y-2 text-center sm:text-left flex-1">
              <h3 className="text-3xl font-black font-quicksand tracking-tight">
                Want more magical books?
              </h3>
              <p className="text-white/80 font-medium text-lg">
                You are in preview mode. Ask your parents to unlock the full library!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

