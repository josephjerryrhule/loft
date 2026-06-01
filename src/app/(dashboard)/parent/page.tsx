"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getParentDashboardData, getCustomerOrders } from "@/app/actions/user";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, RefreshCw, Baby, CreditCard, Sparkles, Plus, ArrowRight, CheckCircle2, ChevronRight, MessageSquare, AlertCircle } from "lucide-react";
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

      const data = await getParentDashboardData();
      setChildProfiles(data.childProfiles || []);

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

  // --- TIME-BASED SUBTITLE GREETINGS ---
  const getSubWelcomeMessage = () => {
    const hours = new Date().getHours();
    if (hours < 12) {
      return "Let’s continue your child’s learning journey.";
    } else if (hours < 18) {
      return "Build confidence one story at a time ❤️";
    } else {
      return "Stories, imagination, and confidence await.";
    }
  };

  // --- DYNAMIC CONTEXTUAL GUIDANCE ALERTS ---
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
        text: "Complete your personalization form to begin production 🎂",
        cta: "Complete Form",
        href: "/parent/orders",
        icon: Sparkles,
        style: "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/20 dark:border-orange-900/50 dark:text-orange-300"
      };
    }

    // 2. Child profile check
    if (childProfiles.length === 0) {
      return {
        text: "Create your first child profile to personalize your experience.",
        cta: "Add Child Profile",
        href: "/parent/children",
        icon: Baby,
        style: "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-300"
      };
    }

    // 3. Active Subscription check
    if (activePlansCount === 0) {
      return {
        text: "Unlock premium adventures and personalized learning experiences for your children.",
        cta: "Explore Plans",
        href: "/parent/plans",
        icon: CreditCard,
        style: "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-300"
      };
    }

    // 4. Reading progress check
    if (totalBooksRead === 0) {
      return {
        text: "Let’s start your child’s first reading adventure.",
        cta: "Explore Books",
        href: "/parent/children",
        icon: BookOpen,
        style: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-300"
      };
    }

    return {
      text: "🔥 Amazing! Your child is building a reading habit. Keep the streak going.",
      cta: "Launch Portal",
      href: "/child",
      icon: Sparkles,
      style: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-300"
    };
  };

  const alertData = getContextualAlert();

  // --- ONBOARDING CALCULATION ---
  // Steps: 1. Add Child, 2. Choose Plan, 3. Explore Library, 4. Start Reading
  const onboardingSteps = [
    {
      title: "Add Your Child Profile",
      desc: "Personalize your child's reading journey.",
      cta: "Add Child",
      href: "/parent/children",
      completed: childProfiles.length > 0
    },
    {
      title: "Choose A Reading Journey",
      desc: "Select a plan that fits your family.",
      cta: "View Plans",
      href: "/parent/plans",
      completed: activePlansCount > 0
    },
    {
      title: "Explore Reading Adventures",
      desc: "Discover stories designed for your child's age and interests.",
      cta: "Explore Books",
      href: "/parent/children",
      completed: totalBooksRead > 0
    },
    {
      title: "Start Reading",
      desc: "Build habits, imagination, and confidence through stories.",
      cta: "Start Reading",
      href: "/child",
      completed: totalBooksRead > 0
    }
  ];

  const completedCount = onboardingSteps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedCount / onboardingSteps.length) * 100);
  const showOnboarding = childProfiles.length === 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Dynamic Welcome Heading */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Welcome Back 👋 Ready for today’s reading adventure?
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-bold tracking-wide">
            {getSubWelcomeMessage()}
          </p>
        </div>
        <div className="flex gap-3 shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-11 px-6 rounded-xl font-bold border-stone-200 hover:bg-stone-50 transition-all flex items-center justify-center gap-2 active:scale-95 text-xs sm:text-sm flex-1 sm:flex-none"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing ? "animate-spin" : "")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Contextual guidance alert */}
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

      {/* PARENT ONBOARDING EXPERIENCE */}
      {showOnboarding && (
        <Card className="border-none shadow-xl overflow-hidden rounded-[2rem] bg-white">
          <div className="bg-gradient-to-r from-[#E87154] to-[#f48a72] p-8 sm:p-10 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <Sparkles size={130} />
            </div>
            <div className="relative z-10 space-y-3">
              <h2 className="text-3xl font-black tracking-tight">Welcome To LOFT ❤️</h2>
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {onboardingSteps.map((step, idx) => (
                <div key={idx} className={cn("p-5 rounded-2xl border flex flex-col justify-between h-48 transition-all duration-300", step.completed ? "bg-emerald-50/20 border-emerald-100" : "bg-stone-50/50 border-stone-200/60")}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {idx + 1}</span>
                      {step.completed && <CheckCircle2 size={16} className="text-emerald-500" />}
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug">{step.title}</h4>
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
          theme={activePlansCount > 0 ? "success" : "white"}
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

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* My Children Section */}
        <Card className="lg:col-span-2 border-none shadow-md overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem]">
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
              /* EMPTY STATE: NO CHILD PROFILE */
              <div className="text-center py-16 space-y-4">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Baby className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-normal">
                  Add a child profile to personalize your LOFT experience.
                </h3>
                <p className="text-slate-500 max-w-xs mx-auto text-xs sm:text-sm font-medium">Create a reading setup tailored specifically for their learning development.</p>
                <Button asChild className="h-12 px-8 rounded-2xl font-black bg-[#E87154] hover:bg-[#D66144] shadow-xl shadow-[#E87154]/20 transition-all active:scale-95 text-white">
                  <Link href="/parent/children">Add Child</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-2">
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

        {/* Side Panel Actions / Support */}
        <div className="space-y-6">
          <Card className="border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden rounded-[2rem]">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-bold">Portal Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-3">
              <Button asChild variant="outline" className="w-full h-12 justify-between rounded-xl font-bold border-slate-100 dark:border-slate-800 hover:bg-slate-50 group">
                <Link href="/parent/orders">
                  My Orders
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-[#E87154] transition-colors" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-12 justify-between rounded-xl font-bold border-slate-100 dark:border-slate-800 hover:bg-slate-50 group">
                <Link href="/settings">
                  Settings
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-[#E87154] transition-colors" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-12 justify-between rounded-xl font-bold border-slate-100 dark:border-slate-800 hover:bg-slate-50 group">
                <Link href="/child" className="flex items-center justify-between w-full">
                  Launch Child Reading Portal
                  <Sparkles size={16} className="text-[#E87154] animate-pulse" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Need Help block */}
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
