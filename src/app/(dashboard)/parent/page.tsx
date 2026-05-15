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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalBooksRead = childProfiles.reduce((sum, child) => sum + (child.completedBooks || 0), 0);
  const activePlansCount = childProfiles.filter((c) => c.activeSubscription).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title=""
        showGreeting
        userName={session?.user?.name || "Parent"}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="shadow-sm"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing ? "animate-spin" : "")} />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PremiumKPICard
          title="Books Read"
          value={totalBooksRead}
          description="Total completed by children"
          icon={BookOpen}
          theme="primary"
          trend={{ value: "Learning", label: "Progress", type: "up" }}
        />
        <PremiumKPICard
          title="My Children"
          value={childProfiles.length}
          description="Registered profiles"
          icon={Baby}
        />
        <PremiumKPICard
          title="Active Plans"
          value={activePlansCount}
          description="Subscription coverage"
          icon={Sparkles}
          theme="success"
        />
        <PremiumKPICard
          title="Manage Billing"
          value="Plans"
          icon={CreditCard}
          className="cursor-pointer hover:border-[#E87154]/50 transition-colors"
          description="Subscription settings"
          trend={{ value: "Manage", label: "Payments", type: "neutral" }}
        />
      </div>

      <div className="grid gap-6">
        {/* My Children Section */}
        <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-50 dark:border-slate-800">
            <div>
              <CardTitle className="text-xl font-black">My Children</CardTitle>
              <CardDescription>Reading progress and subscription status</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="h-8">
                    <Link href="/parent/plans">
                        <CreditCard className="h-3.5 w-3.5 mr-1.5" /> Plans
                    </Link>
                </Button>
                <Button asChild size="sm" className="h-8 bg-[#E87154] hover:bg-[#D66144]">
                    <Link href="/parent/children">
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Child
                    </Link>
                </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {childProfiles.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Baby className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No child profiles yet</h3>
                <p className="text-slate-500 max-w-xs mx-auto">Add your first child to start their reading journey with Loft.</p>
                <Button asChild className="bg-[#E87154] hover:bg-[#D66144]">
                  <Link href="/parent/children">Add Your First Child</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {childProfiles.map((child) => (
                  <div
                    key={child.id}
                    className="group relative flex flex-col p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-xl hover:border-[#E87154]/20 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 mb-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg transform group-hover:rotate-3 transition-transform"
                          style={{ backgroundColor: child.avatarColor || "#E87154" }}
                        >
                          {child.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-lg truncate text-slate-900 dark:text-white">{child.name}</h4>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                             <BookOpen size={12} /> {child.completedBooks} books completed
                          </div>
                        </div>
                    </div>

                    <div className="mt-auto space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</span>
                            {child.activeSubscription ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] font-bold">
                                ✓ {child.activeSubscription.plan.name}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-500/20 bg-amber-50 dark:bg-amber-900/20 text-[10px] font-bold">
                                No Active Plan
                              </Badge>
                            )}
                        </div>

                        {!child.activeSubscription ? (
                          <Button asChild variant="outline" className="w-full h-9 text-xs font-bold border-[#E87154]/20 text-[#E87154] hover:bg-[#E87154] hover:text-white group">
                            <Link href="/parent/plans" className="flex items-center justify-center gap-2">
                               Get a Plan <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                          </Button>
                        ) : (
                           <Button asChild variant="ghost" className="w-full h-9 text-xs font-bold text-slate-400 hover:text-slate-600">
                             <Link href="/parent/children">Manage Profile</Link>
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

// Helper function for class merging
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}

