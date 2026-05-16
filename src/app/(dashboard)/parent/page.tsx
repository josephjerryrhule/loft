"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getParentDashboardData } from "@/app/actions/user";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, RefreshCw, Baby, CreditCard, Sparkles, Plus, ArrowRight } from "lucide-react";
import { PremiumKPICard } from "@/components/dashboard/PremiumKPICard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

type ParentChildProfile = {
  id: string;
  name: string;
  avatarColor?: string | null;
  completedBooks: number;
  activeSubscription?: {
    plan: {
      name: string;
    };
  } | null;
};

export default function ParentDashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [childProfiles, setChildProfiles] = useState<ParentChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        if (!loading) setRefreshing(true);
        else setLoading(true);
      } else {
        setRefreshing(true);
      }

      const data = await getParentDashboardData();
      setChildProfiles(data.childProfiles || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading]);

  useEffect(() => {
    loadDashboardData();

    // Re-fetch when window regains focus
    const handleFocus = () => loadDashboardData(true);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadDashboardData]);

  const handleRefresh = async () => {
    router.refresh();
    await loadDashboardData(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#E87154]" />
      </div>
    );
  }

  const totalBooksRead = childProfiles.reduce((sum, child) => sum + (child.completedBooks || 0), 0);
  const activePlansCount = childProfiles.filter((c) => c.activeSubscription).length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title=""
        showGreeting
        userName={session?.user?.name || "Parent"}
        actions={
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-11 sm:h-12 px-4 sm:px-8 rounded-2xl font-black border-2 border-slate-100 dark:border-slate-800 hover:bg-slate-50 transition-all active:scale-95"
          >
            <RefreshCw className={cn("h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3", refreshing ? "animate-spin" : "")} />
            <span className="text-sm sm:text-base">Refresh</span>
          </Button>
        }
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <PremiumKPICard
          title="Books Read"
          value={totalBooksRead}
          description="Total completed"
          icon={BookOpen}
          theme="primary"
          trend={{ value: "Learning", label: "Progress", type: "up" }}
        />
        <PremiumKPICard
          title="My Children"
          value={childProfiles.length}
          description="Lofters"
          icon={Baby}
        />
        <PremiumKPICard
          title="Active Plans"
          value={activePlansCount}
          description="Coverage"
          icon={Sparkles}
          theme="success"
        />
        <PremiumKPICard
          title="Billing"
          value="Plans"
          icon={CreditCard}
          className="cursor-pointer hover:border-[#E87154]/50 transition-colors"
          description="Settings"
          trend={{ value: "Manage", label: "Payments", type: "neutral" }}
        />
      </div>

      <div className="grid gap-6">
        {/* My Children Section */}
        <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem]">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-10 border-b border-slate-50 dark:border-slate-800 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                  <div className="h-6 w-6 rounded-lg bg-[#E87154]/20 flex items-center justify-center">
                      <Baby size={12} className="text-[#E87154]" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Household Management</span>
              </div>
              <CardTitle className="text-2xl font-black">My Children</CardTitle>
              <CardDescription className="text-sm font-medium">Reading progress and subscription status for your lofters</CardDescription>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button asChild variant="outline" className="flex-1 sm:flex-none h-11 px-5 rounded-xl font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all active:scale-95">
                    <Link href="/parent/plans" className="flex items-center justify-center gap-2 text-xs sm:text-sm">
                        <CreditCard className="h-4 w-4 text-[#E87154]" /> Plans
                    </Link>
                </Button>
                <Button asChild className="flex-1 sm:flex-none h-11 px-5 rounded-xl font-bold bg-[#E87154] hover:bg-[#D66144] shadow-lg shadow-[#E87154]/20 text-white transition-all active:scale-95">
                    <Link href="/parent/children" className="flex items-center justify-center gap-2 text-xs sm:text-sm">
                        <Plus className="h-4 w-4" /> Profile
                    </Link>
                </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-10">
            {childProfiles.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Baby className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No child profiles yet</h3>
                <p className="text-slate-500 max-w-xs mx-auto">Add your first child to start their reading journey with Loft.</p>
                <Button asChild className="h-12 px-8 rounded-2xl font-black bg-[#E87154] hover:bg-[#D66144] shadow-xl shadow-[#E87154]/20 transition-all active:scale-95 text-white">
                  <Link href="/parent/children">Add Your First Child</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {childProfiles.map((child) => (
                  <div
                    key={child.id}
                    className="group relative flex flex-col p-5 sm:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-2xl hover:border-[#E87154]/20 transition-all duration-500"
                  >
                    <div className="flex items-center gap-4 mb-6">
                        <div
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1.25rem] flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-lg transform group-hover:rotate-6 transition-transform"
                          style={{ backgroundColor: child.avatarColor || "#E87154" }}
                        >
                          {child.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-lg sm:text-xl truncate text-slate-900 dark:text-white tracking-tight">{child.name}</h4>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                             <BookOpen size={14} /> {child.completedBooks} books read
                          </div>
                        </div>
                    </div>

                    <div className="mt-auto space-y-4">
                      <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Subscription</span>
                          {child.activeSubscription ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] font-black uppercase tracking-widest px-3 h-6 shadow-sm">
                              {child.activeSubscription.plan.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-[10px] font-black uppercase tracking-widest px-3 h-6">
                              Inactive
                            </Badge>
                          )}
                      </div>

                      {!child.activeSubscription ? (
                        <Button asChild className="w-full h-12 rounded-2xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-lg shadow-[#E87154]/20 transition-all active:scale-95 text-white group">
                          <Link href="/parent/plans" className="flex items-center justify-center gap-2">
                             Choose Plan <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      ) : (
                         <Button asChild variant="ghost" className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#E87154] hover:bg-[#E87154]/5 transition-all">
                           <Link href="/parent/children">Manage Access</Link>
                         </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
