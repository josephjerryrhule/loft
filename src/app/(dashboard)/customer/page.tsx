"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCustomerDashboardData, getCustomerOrders } from "@/app/actions/user";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, RefreshCw, Sparkles, CreditCard, ShoppingBag, ArrowRight, CheckCircle2, ChevronRight, MessageSquare, AlertCircle, Heart } from "lucide-react";
import { PremiumKPICard } from "@/components/dashboard/PremiumKPICard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function CustomerDashboardPage() {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<any>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
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

      const ordersData = await getCustomerOrders(1, 10);
      setOrders(ordersData.orders || []);
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

  // --- WELCOME MESSAGES (Time-based selection) ---
  const getSubWelcomeMessage = () => {
    const hours = new Date().getHours();
    if (hours < 12) {
      return "Let’s continue your child’s learning journey.";
    } else if (hours < 18) {
      return (
        <span className="inline-flex items-center gap-1">
          Build confidence one story at a time <Heart className="h-3.5 w-3.5 text-[#E87154] fill-[#E87154] inline" />
        </span>
      );
    } else {
      return "Stories, imagination, and confidence await.";
    }
  };

  // --- CONTEXTUAL GUIDANCE ALERTS ---
  const getContextualAlert = () => {
    // 1. Birthday book personalization check
    const hasPendingPersonalization = orders.some(order => 
      order.product?.requiresCustomization && 
      (!order.customizationData || (() => {
        try {
          const parsed = JSON.parse(order.customizationData);
          return parsed.personalizationStatus !== "SUBMITTED";
        } catch(e) {
          return true;
        }
      })())
    );

    if (hasPendingPersonalization) {
      return {
        text: "Complete your personalization form to begin production.",
        cta: "Complete Form",
        href: "/customer/orders",
        icon: Sparkles,
        style: "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/20 dark:border-orange-900/50 dark:text-orange-300"
      };
    }

    // 2. Active Subscription check
    if (!subscription) {
      return {
        text: "Unlock premium adventures and personalized learning experiences.",
        cta: "Explore Plans",
        href: "/customer/plans",
        icon: AlertCircle,
        style: "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-300"
      };
    }

    // 3. Reading progress check
    if (readingProgress === 0) {
      return {
        text: "Let’s start your child’s first reading adventure.",
        cta: "Explore Books",
        href: "/customer/flipbooks",
        icon: BookOpen,
        style: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-300"
      };
    }

    // 4. Streak default if they read
    return {
      text: "Amazing! Your child is building a reading habit. Keep the streak going.",
      cta: "Read Now",
      href: "/customer/flipbooks",
      icon: Sparkles,
      style: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-300"
    };
  };

  const alertData = getContextualAlert();

  // --- ONBOARDING CALCULATION ---
  // Steps: 1. Choose Plan (Subscribed), 2. Explore Library, 3. Read Book
  const onboardingSteps = [
    {
      title: "Choose A Reading Journey",
      desc: "Select a plan that fits your family.",
      cta: "View Plans",
      href: "/customer/plans",
      completed: !!subscription
    },
    {
      title: "Explore Reading Adventures",
      desc: "Discover stories designed for your child's age and interests.",
      cta: "Explore Books",
      href: "/customer/flipbooks",
      completed: readingProgress > 0
    },
    {
      title: "Start Reading",
      desc: "Build habits, imagination, and confidence through stories.",
      cta: "Start Reading",
      href: "/customer/flipbooks",
      completed: readingProgress > 0
    }
  ];

  const completedCount = onboardingSteps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedCount / onboardingSteps.length) * 100);
  const showOnboarding = !subscription;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Top Welcome Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome Back! Ready for today’s reading adventure?
          </h1>
          <div className="text-xs sm:text-sm text-stone-500 font-bold tracking-wide">
            {getSubWelcomeMessage()}
          </div>
        </div>
        <div className="flex gap-3 shrink-0 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="h-11 px-6 rounded-xl font-bold border-stone-200 hover:bg-stone-50 transition-all flex items-center justify-center gap-2 active:scale-95 text-xs sm:text-sm flex-1 sm:flex-none"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing ? "animate-spin" : "")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Dynamic Contextual Alert */}
      {alertData && (
        <div className={cn("p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300", alertData.style)}>
          <div className="flex items-center gap-3">
            <alertData.icon size={20} className="shrink-0" />
            <span className="text-xs sm:text-sm font-bold tracking-tight leading-relaxed">{alertData.text}</span>
          </div>
          <Button asChild className="h-10 px-5 rounded-xl font-bold text-xs bg-white text-slate-800 border hover:bg-slate-50 shadow-sm shrink-0 w-full sm:w-auto">
            <Link href={alertData.href}>{alertData.cta}</Link>
          </Button>
        </div>
      )}

      {/* ONBOARDING PROGRESS EXPERIENCE */}
      {showOnboarding && (
        <Card className="border-none shadow-xl overflow-hidden rounded-[2rem] bg-white">
          <div className="bg-gradient-to-r from-[#E87154] to-[#f48a72] p-8 sm:p-10 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <Sparkles size={130} />
            </div>
            <div className="relative z-10 space-y-3">
              <h2 className="text-3xl font-black tracking-tight flex items-center gap-2">Welcome To LOFT <Heart className="h-6 w-6 text-white fill-white inline" /></h2>
              <p className="text-white/80 font-bold text-sm max-w-2xl leading-relaxed">
                A world of stories, imagination, confidence, and meaningful learning awaits. We’re excited to help your child build confidence through magical reading adventures rooted in imagination, culture, and joyful discovery. Let’s get everything ready.
              </p>
              
              <div className="pt-4 space-y-2 max-w-md">
                <div className="flex justify-between items-end text-xs font-black uppercase tracking-wider text-white/90">
                  <span>Getting Started Progress</span>
                  <span>{progressPercent}% Complete</span>
                </div>
                <div className="h-3 w-full bg-white/25 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="text-[10px] italic text-white/70">
                  You're only a few steps away from beginning your LOFT journey.
                </p>
              </div>
            </div>
          </div>
          <CardContent className="p-8 sm:p-10 space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {onboardingSteps.map((step, idx) => (
                <div key={idx} className={cn("p-5 rounded-2xl border flex flex-col justify-between h-48 transition-all duration-300", step.completed ? "bg-emerald-50/20 border-emerald-100" : "bg-stone-50/50 border-stone-200/60")}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {idx + 1}</span>
                      {step.completed && <CheckCircle2 size={16} className="text-emerald-500" />}
                    </div>
                    <h4 className="text-base font-black text-slate-900 leading-snug">{step.title}</h4>
                    <p className="text-xs text-stone-500 leading-relaxed font-semibold">{step.desc}</p>
                  </div>
                  
                  {!step.completed ? (
                    <Button asChild className="w-full h-10 rounded-xl bg-[#E87154] hover:bg-[#D66144] font-bold text-xs text-white shadow-sm mt-3">
                      <Link href={step.href}>{step.cta}</Link>
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold uppercase tracking-wider py-2 mt-3">
                      <CheckCircle2 size={14} /> Step Completed
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

          {/* Contact Support block */}
          <div className="bg-stone-50 border border-stone-200 rounded-[2rem] p-6 text-center">
            <h4 className="text-sm font-black text-slate-800 mb-1">Need Help?</h4>
            <p className="text-xs text-slate-500 font-semibold mb-4 leading-relaxed">We’re here to help you every step of the way.</p>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1 rounded-xl h-10 text-xs font-bold border-stone-200 bg-white hover:bg-stone-50">
                <Link href="mailto:support@myloftstory.com" className="flex items-center justify-center gap-1.5"><MessageSquare size={13} /> Support</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 rounded-xl h-10 text-xs font-bold border-stone-200 bg-white hover:bg-stone-50">
                <Link href="/faq" className="flex items-center justify-center gap-1.5">FAQ Center</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
