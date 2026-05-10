import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/child-auth";
import { getChildFlipbooks } from "@/app/actions/child-flipbooks";
import { Bookshelf } from "@/components/child/Bookshelf";
import { LogOut, BookOpen, Trophy, Star, ChevronRight } from "lucide-react";
import Image from "next/image";
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
      <div className="space-y-2">
        <DynamicGreeting />
        <h1 className="text-4xl sm:text-5xl font-black text-[#2D2D2D] font-quicksand tracking-tight">
          Welcome back, <span className="text-[#E87154]">{childName || session.username}</span>!
        </h1>
      </div>

      {/* Bento Grid Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Continue Reading Card */}
        {lastReadProgress ? (
          <div className="md:col-span-8 bg-white rounded-[40px] p-8 border border-[#E87154]/10 shadow-[0_10px_40px_rgba(232,113,84,0.05)] relative overflow-hidden group hover:shadow-[0_20px_60px_rgba(232,113,84,0.1)] transition-all duration-500">
             {/* Decorative Background */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#E87154]/5 to-transparent rounded-full -mr-20 -mt-20 blur-3xl"></div>
             
             <div className="relative flex flex-col sm:flex-row gap-8 items-center h-full">
                <div className="w-40 sm:w-48 aspect-[3/4] relative rounded-2xl overflow-hidden shadow-2xl transform group-hover:rotate-2 transition-transform duration-500">
                  <Image 
                    src={lastReadProgress.coverImageUrl || "/images/book-placeholder.png"} 
                    alt={lastReadProgress.title} 
                    fill 
                    className="object-cover"
                  />
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-white/20 to-transparent"></div>
                </div>

                <div className="flex-1 space-y-6 text-center sm:text-left">
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E87154]/10 text-[#E87154] text-xs font-black uppercase tracking-widest">
                      <BookOpen className="w-3.5 h-3.5" /> Continue Reading
                    </span>
                    <h3 className="text-3xl font-black text-[#2D2D2D] font-quicksand leading-tight">
                      {lastReadProgress.title}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-black text-[#BBBBBB] uppercase tracking-wider">Progress</span>
                        <span className="text-sm font-black text-[#E87154]">{lastReadProgress.progress}%</span>
                      </div>
                      <div className="h-3 w-full bg-[#F5F5F5] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#E87154] rounded-full shadow-[0_0_10px_rgba(232,113,84,0.3)] transition-all duration-1000" 
                          style={{ width: `${lastReadProgress.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <Link href={`/child/flipbooks/${lastReadProgress.id}`}>
                      <Button className="w-full sm:w-auto h-14 px-8 bg-[#E87154] hover:bg-[#D65D41] text-white rounded-2xl font-black text-lg shadow-[0_10px_25px_rgba(232,113,84,0.25)] hover:shadow-[0_15px_35px_rgba(232,113,84,0.35)] transition-all flex items-center justify-center gap-3">
                        Jump In! <ChevronRight className="w-6 h-6" />
                      </Button>
                    </Link>
                  </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="md:col-span-8 bg-white rounded-[40px] p-12 border border-[#E87154]/10 shadow-[0_10px_40px_rgba(232,113,84,0.05)] relative overflow-hidden flex flex-col items-center justify-center text-center space-y-6">
             <div className="w-24 h-24 bg-[#E87154]/10 rounded-full flex items-center justify-center text-5xl">✨</div>
             <div className="space-y-2">
               <h3 className="text-3xl font-black text-[#2D2D2D] font-quicksand">Ready for an Adventure?</h3>
               <p className="text-[#6D6D6D] font-medium text-lg max-w-sm">Pick your first book from the shelf below to start your magical journey!</p>
             </div>
          </div>
        )}

        {/* Stats and Achievements Column */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="flex gap-6">
            <div className="flex-1 bg-white rounded-[40px] p-6 border border-[#E87154]/10 shadow-[0_10px_40px_rgba(232,113,84,0.05)] flex flex-col justify-center items-center text-center group hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-[#E87154]/10 rounded-2xl flex items-center justify-center text-[#E87154] mb-3 group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6" fill="currentColor" />
              </div>
              <span className="text-3xl font-black text-[#2D2D2D] font-quicksand leading-none mb-1">{stats?.totalBooksRead || 0}</span>
              <span className="text-[10px] font-bold text-[#BBBBBB] uppercase tracking-[0.2em]">Books</span>
            </div>

            <div className="flex-1 bg-[#E87154] rounded-[40px] p-6 shadow-[0_15px_40px_rgba(232,113,84,0.3)] flex flex-col justify-center items-center text-center text-white group hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6" />
              </div>
              <span className="text-3xl font-black font-quicksand leading-none mb-1">{stats?.readingStreak || 0}</span>
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em]">Streak</span>
            </div>
          </div>

          {/* Achievements Card */}
          <div className="flex-1 bg-white rounded-[40px] p-8 border border-[#E87154]/10 shadow-[0_10px_40px_rgba(232,113,84,0.05)] relative overflow-hidden group">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-[#2D2D2D] font-quicksand">Achievements</h3>
                <span className="text-[10px] font-black text-[#E87154] bg-[#E87154]/10 px-3 py-1 rounded-full uppercase tracking-widest">{stats?.badges?.length || 0} Total</span>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {stats?.badges?.slice(0, 6).map((badge: any) => (
                  <div key={badge.id} className="aspect-square bg-[#F9F9F9] rounded-2xl flex flex-col items-center justify-center p-2 border border-[#F0F0F0] hover:border-[#E87154]/30 hover:bg-white transition-all group/badge" title={badge.description}>
                    <span className="text-2xl mb-1 transform group-hover/badge:scale-125 transition-transform">{badge.icon}</span>
                    <span className="text-[8px] font-black text-[#BBBBBB] uppercase text-center line-clamp-1">{badge.title}</span>
                  </div>
                ))}
                {(!stats?.badges || stats.badges.length === 0) && (
                  <div className="col-span-3 py-4 text-center">
                    <p className="text-[#BBBBBB] text-xs font-bold italic">Keep reading to earn badges! ✨</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!hasAccess && (
        <div className="group">
          <div className="bg-white border-2 border-[#E87154]/10 p-8 rounded-[40px] shadow-[0_10px_40px_rgba(232,113,84,0.04)] relative overflow-hidden transition-all hover:shadow-[0_15px_50px_rgba(232,113,84,0.08)]">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#E87154]"></div>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-[#E87154]/10 rounded-full flex items-center justify-center text-3xl">✨</div>
              <div className="space-y-1 text-center sm:text-left flex-1">
                <h3 className="text-2xl font-black text-[#2D2D2D] font-quicksand">
                  Ask your parents to unlock more!
                </h3>
                <p className="text-[#6D6D6D] font-medium text-lg">
                  You are in preview mode. Ask them to subscribe to see all your magical books!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Bookshelf flipbooks={flipbooks} />
    </div>
  );
}
