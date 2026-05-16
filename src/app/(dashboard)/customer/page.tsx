"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCustomerDashboardData } from "@/app/actions/user";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, RefreshCw, Sparkles, CreditCard, ShoppingBag, ArrowRight } from "lucide-react";
import { PremiumKPICard } from "@/components/dashboard/PremiumKPICard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function CustomerDashboardPage() {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<any>(null);
  const [readingProgress, setReadingProgress] = useState(0);
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
      
      const data = await getCustomerDashboardData();
      setSubscription(data.subscription);
      setReadingProgress(data.completedBooks);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading]);

  useEffect(() => {
    loadDashboardData();

    const handleFocus = () => loadDashboardData(true);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#E87154]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title=""
        showGreeting
        userName={session?.user?.name || "Lofter"}
        actions={
          <Button 
            variant="outline" 
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="h-12 px-8 rounded-2xl font-black border-2 border-slate-100 dark:border-slate-800 hover:bg-slate-50 transition-all active:scale-95"
          >
            <RefreshCw className={cn("h-5 w-5 mr-3", refreshing ? "animate-spin" : "")} />
            Refresh Data
          </Button>
        }
      />
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <PremiumKPICard
          title="Current Plan"
          value={subscription ? subscription.plan.name : "Free Basic"}
          description={subscription ? `GHS ${Number(subscription.plan.price).toFixed(2)}` : "Entry Access"}
          icon={Sparkles}
          theme={subscription ? "success" : "white"}
          trend={subscription ? { value: "Premium", label: "Active", type: "up" } : undefined}
        />
        <PremiumKPICard
          title="Books Read"
          value={readingProgress}
          description="Total completed"
          icon={BookOpen}
          theme="primary"
          trend={{ value: "Learning", label: "Progress", type: "up" }}
        />
        <PremiumKPICard
          title="Fulfillment"
          value="Orders"
          description="Purchase history"
          icon={ShoppingBag}
          className="cursor-pointer hover:border-[#E87154]/50 transition-colors"
          trend={{ value: "Manage", label: "Tracker", type: "neutral" }}
        />
        <PremiumKPICard
          title="Billing"
          value="Plans"
          description="Subscription hub"
          icon={CreditCard}
          theme="info"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Action Card */}
        <Card className="lg:col-span-2 border-none shadow-md overflow-hidden bg-white rounded-[2.5rem]">
            <div className="bg-[#FFFAF5] p-10 border-b border-stone-100 relative">
                <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12">
                    <BookOpen size={160} className="text-stone-900" />
                </div>
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-6 w-6 rounded-lg bg-[#E87154]/10 flex items-center justify-center">
                            <Sparkles size={12} className="text-[#E87154]" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Library Access</span>
                    </div>
                    <CardTitle className="text-3xl sm:text-4xl font-black text-slate-900 leading-none tracking-tight">Your Digital Bookshelf</CardTitle>
                    <p className="text-slate-500 font-medium text-base sm:text-lg max-w-lg">
                        Dive into your curated collection of interactive stories and educational content.
                    </p>
                    <div className="pt-4">
                        <Button asChild className="h-14 px-10 rounded-2xl bg-[#E87154] hover:bg-[#D66144] font-black shadow-lg shadow-[#E87154]/20 transition-all active:scale-95 text-white text-base group">
                            <Link href="/customer/flipbooks" className="flex items-center gap-3">
                                <BookOpen size={20} />
                                Open Bookshelf
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </Card>

        {/* Quick Links / Sidebar info */}
        <div className="space-y-6">
            <Card className="border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden rounded-[2rem]">
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-3">
                    <Button asChild variant="outline" className="w-full h-12 justify-between rounded-xl font-bold border-slate-100 dark:border-slate-800 hover:bg-slate-50 group">
                        <Link href="/customer/orders">
                            My Orders
                            <ArrowRight size={16} className="text-slate-300 group-hover:text-[#E87154] transition-colors" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full h-12 justify-between rounded-xl font-bold border-slate-100 dark:border-slate-800 hover:bg-slate-50 group">
                        <Link href="/customer/plans">
                            Upgrade Account
                            <ArrowRight size={16} className="text-slate-300 group-hover:text-[#E87154] transition-colors" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full h-12 justify-between rounded-xl font-bold border-slate-100 dark:border-slate-800 hover:bg-slate-50 group">
                        <Link href="/settings">
                            Profile Settings
                            <ArrowRight size={16} className="text-slate-300 group-hover:text-[#E87154] transition-colors" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            {!subscription && (
                <div className="bg-[#E87154]/5 border-2 border-[#E87154]/10 rounded-[2rem] p-6 text-center animate-in zoom-in-95 duration-500">
                    <Sparkles className="h-10 w-10 text-[#E87154] mx-auto mb-4 opacity-50" />
                    <h4 className="text-base font-black text-slate-900 dark:text-white mb-2">Unlock Premium Stories</h4>
                    <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">Gain access to our full library of interactive flipbooks and personalized content.</p>
                    <Button asChild className="w-full h-12 rounded-xl bg-[#E87154] hover:bg-[#D66144] font-black text-white shadow-lg">
                        <Link href="/customer/plans">View Plans</Link>
                    </Button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
