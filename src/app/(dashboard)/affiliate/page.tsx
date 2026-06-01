import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { getAffiliateStats, getRecentAffiliateActivities, getAffiliateMonthlyEarningsData } from "@/app/actions/affiliate";
import { getTeamLeaderStats } from "@/app/actions/team-leader";
import { getMinimumPayoutAmount } from "@/app/actions/settings";
import { EarningsChart } from "@/components/dashboard/EarningsChart";
import { ActivityTable } from "@/components/dashboard/ActivityTable";
import { CopyInviteLinkButton } from "@/components/affiliate/CopyInviteLinkButton";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TrendingUp, Users, DollarSign, Wallet, Clock, Zap, Target, Sparkles, CheckCircle2, AlertCircle, MessageSquare, Heart, Rocket } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PremiumKPICard } from "@/components/dashboard/PremiumKPICard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DashboardTable } from "@/components/dashboard/DashboardTable";
import { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

// Force dynamic rendering - this page requires authentication and real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AffiliateDashboardPage() {
  const session = await auth();
  
  // Role protection - only affiliates and team leaders can access
  // @ts-ignore
  const role = session?.user?.role;
  if (!session?.user || (role !== Role.AFFILIATE && role !== Role.TEAM_LEADER)) {
    redirect("/parent");
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: { inviteCode: true, firstName: true, payoutMethodType: true, payoutDetails: true }
  });
  
  const stats = await getAffiliateStats();
  const teamStats = role === Role.TEAM_LEADER ? await getTeamLeaderStats() : null;
  const activities = await getRecentAffiliateActivities();
  const chartData = await getAffiliateMonthlyEarningsData();
  const minimumPayoutAmount = await getMinimumPayoutAmount();

  if (!stats) return <div>Loading...</div>;

  const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXTAUTH_URL || '';

  // Time of day subtitle greetings (alternative contexts)
  const getSubWelcomeMessage = () => {
    const hours = new Date().getHours();
    if (hours < 12) {
      return (
        <span className="flex items-center gap-1.5">
          You’re helping families discover confidence through stories <Heart className="h-4 w-4 text-[#E87154] fill-[#E87154] inline" />
        </span>
      );
    } else if (hours < 18) {
      return "Let’s grow your community impact.";
    } else {
      return (
        <span className="flex items-center gap-1.5">
          Time to share more reading magic <Rocket className="h-4 w-4 text-[#E87154] inline animate-pulse" />
        </span>
      );
    }
  };

  // Onboarding steps check
  const onboardingSteps = [
    {
      title: "Complete Ambassador Setup",
      desc: "Configure your payout details to receive commissions.",
      cta: "Complete Setup",
      href: "/settings",
      completed: !!user?.payoutDetails
    },
    {
      title: "Get Your Referral Tools",
      desc: "Access banner designs, QR codes, and affiliate tools.",
      cta: "View Tools",
      href: "/affiliate/marketing",
      completed: !!user?.inviteCode
    },
    {
      title: "Learn How Earnings Work",
      desc: "Understand commission structures and payout schedules.",
      cta: "Understand Commissions",
      href: "/affiliate/commissions",
      completed: stats.totalEarnings > 0
    },
    {
      title: "Start Sharing LOFT",
      desc: "Start sharing your referral link with families.",
      cta: "Start Promoting",
      href: "/affiliate/marketing",
      completed: stats.referralsCount > 0
    }
  ];

  const completedCount = onboardingSteps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedCount / onboardingSteps.length) * 100);
  const showOnboarding = stats.referralsCount === 0 && !user?.payoutDetails;

  // Dynamic Contextual Messages
  const getContextualAlert = () => {
    if (!user?.payoutDetails) {
      return {
        text: "Complete your payout details setup to receive your weekly commissions automatically.",
        cta: "Configure Setup",
        href: "/settings",
        icon: AlertCircle,
        style: "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/20 dark:border-orange-900/50 dark:text-orange-300",
        isCopyCTA: false
      };
    }

    if (stats.referralsCount === 0) {
      return {
        text: "No referrals yet. Share your referral link to begin earning.",
        cta: "Share Referral Link",
        href: "/affiliate/marketing",
        icon: Users,
        style: "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-300",
        isCopyCTA: true
      };
    }

    if (stats.approvedBalance >= minimumPayoutAmount) {
      return {
        text: "Great work! Your latest commissions are now payable.",
        cta: "View Earnings",
        href: "/affiliate/commissions?tab=payouts",
        icon: Wallet,
        style: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-300",
        isCopyCTA: false
      };
    }

    if (stats.referralsCount % 2 === 0) {
      return {
        text: "You’re 2 signups away from today’s goal. Competition ends in 5 hours. Keep going!",
        cta: "View Rankings",
        href: "/leaderboard",
        icon: Target,
        style: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-300",
        isCopyCTA: false
      };
    } else {
      return {
        text: "You’re currently in 2nd place. Only 1 signup behind.",
        cta: "View Rankings",
        href: "/leaderboard",
        icon: Target,
        style: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-300",
        isCopyCTA: false
      };
    }
  };

  const alertData = getContextualAlert();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Welcome Back! Ready to grow your impact today?"
        subtitle={getSubWelcomeMessage()}
        actions={
          user?.inviteCode && (
            <CopyInviteLinkButton 
              text={`${origin}/join/customer/${user.inviteCode}`} 
              label="Copy Invite link" 
            />
          )
        }
      />

      {/* Dynamic Contextual Alert */}
      {alertData && (
        <div className={cn("p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300", alertData.style)}>
          <div className="flex items-center gap-3">
            <alertData.icon size={20} className="shrink-0" />
            <span className="text-xs sm:text-sm font-bold tracking-tight leading-relaxed">{alertData.text}</span>
          </div>
          {alertData.isCopyCTA ? (
            <div className="shrink-0 w-full sm:w-auto">
              <CopyInviteLinkButton 
                text={`${origin}/join/customer/${user?.inviteCode || ''}`} 
                label={alertData.cta} 
              />
            </div>
          ) : (
            <Button asChild className="h-10 px-5 rounded-xl font-bold text-xs bg-white text-slate-800 border hover:bg-slate-50 shadow-sm shrink-0 w-full sm:w-auto">
              <Link href={alertData.href}>{alertData.cta}</Link>
            </Button>
          )}
        </div>
      )}

      {/* AMBASSADOR ONBOARDING EXPERIENCE */}
      {showOnboarding && (
        <Card className="border-none shadow-xl overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900">
          <div className="bg-gradient-to-r from-[#E87154] to-[#f48a72] p-8 sm:p-10 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <Sparkles size={130} />
            </div>
            <div className="relative z-10 space-y-3">
              <h2 className="text-3xl font-black tracking-tight flex items-center gap-2">Welcome To The LOFT Ambassador Community <Sparkles className="h-6 w-6 text-white inline fill-white" /></h2>
              <p className="text-white/80 font-bold text-sm max-w-2xl leading-relaxed">
                Help families discover magical reading experiences while building meaningful impact. You’re officially part of the mission to help children grow in confidence through stories, imagination, and learning. Let’s get you ready.
              </p>
              
              <div className="pt-4 space-y-2 max-w-md">
                <div className="flex justify-between items-end text-xs font-black uppercase tracking-wider text-white/90">
                  <span>Getting Started Progress</span>
                  <span>{progressPercent}% Complete</span>
                </div>
                <div className="h-3 w-full bg-white/25 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="text-[10px] flex items-center gap-1 text-white/70">
                  <span>Your impact journey starts here</span> <Rocket className="h-3.5 w-3.5 text-white inline" />
                </div>
              </div>
            </div>
          </div>
          <CardContent className="p-8 sm:p-10 space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {onboardingSteps.map((step, idx) => (
                <div key={idx} className={cn("p-5 rounded-2xl border flex flex-col justify-between h-48 transition-all duration-300", step.completed ? "bg-emerald-50/20 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30" : "bg-stone-50/50 border-stone-200/60 dark:bg-slate-800/40 dark:border-slate-700/50")}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Step {idx + 1}</span>
                      {step.completed && <CheckCircle2 size={16} className="text-emerald-500" />}
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">{step.title}</h4>
                    <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed font-semibold">{step.desc}</p>
                  </div>
                  
                  {!step.completed ? (
                    <Button asChild className="w-full h-10 rounded-xl bg-[#E87154] hover:bg-[#D66144] font-bold text-xs text-white shadow-sm mt-3 border-none">
                      <Link href={step.href}>{step.cta}</Link>
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider py-2 mt-3">
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <PremiumKPICard
          title="Marketing Tools"
          value="Active"
          description="QR Code & ID Badge"
          icon={Zap}
          theme="primary"
          trend={{ value: "Ready", label: "Tools", type: "neutral" }}
        />
        <PremiumKPICard
          title={role === Role.TEAM_LEADER ? "My Sales" : "My Referrals"}
          value={stats.referralsCount}
          description="Customers signed up"
          icon={Users}
        />
        {role === Role.TEAM_LEADER && teamStats && (
            <PremiumKPICard
                title="My Team"
                value={teamStats.teamCount}
                description="Affiliates assigned"
                icon={Target}
                theme="info"
            />
        )}
        <PremiumKPICard
          title="Total Earnings"
          value={`GHS ${stats.totalEarnings.toFixed(2)}`}
          description="Lifetime earnings"
          icon={DollarSign}
        />
        <PremiumKPICard
          title="Approved Balance"
          value={`GHS ${stats.approvedBalance.toFixed(2)}`}
          description="Ready for payout"
          icon={Wallet}
          className="border-b-4 border-b-emerald-500"
        />
        <PremiumKPICard
          title="Pending Balance"
          value={`GHS ${stats.pendingBalance.toFixed(2)}`}
          description="Awaiting approval"
          icon={Clock}
          className="border-b-4 border-b-amber-500"
        />
        {!teamStats && (
             <PremiumKPICard
             title="This Month"
             value={`GHS ${stats.monthEarnings.toFixed(2)}`}
             description="Earnings this month"
             icon={TrendingUp}
           />
        )}
      </div>

      <div className="grid gap-6">
        <div className="grid gap-6 lg:grid-cols-3">
            {/* Payout Settings & Statements Card */}
            <Card className="border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden flex flex-col justify-center">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold">Automatic Payouts</CardTitle>
                    <CardDescription>Earnings are processed weekly in-hand</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {user?.payoutDetails ? (
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Registered Payout Method</p>
                            <p className="text-sm font-black text-slate-800 dark:text-stone-200 capitalize">{user.payoutMethodType === "momo" ? "Mobile Money" : "Bank Transfer"}</p>
                            <p className="text-xs text-slate-500 font-mono mt-1">{user.payoutDetails}</p>
                        </div>
                    ) : (
                        <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50">
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider mb-1">Configuration Needed</p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 leading-normal">Configure your Mobile Money or Bank details in settings to receive payouts.</p>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Link href="/affiliate/commissions?tab=payouts" className="flex-1">
                            <Button className="w-full bg-[#E87154] hover:bg-[#D66144] font-bold text-xs text-white rounded-xl h-10 shadow-md transition-all active:scale-95 border-none">
                                Payout Statements
                            </Button>
                        </Link>
                        <Link href="/settings">
                            <Button variant="outline" className="border-slate-200 hover:bg-slate-50 font-bold text-xs rounded-xl h-10 px-3">
                                Edit Settings
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Team Leader Special Card */}
            {role === Role.TEAM_LEADER && teamStats ? (
                <Card className="lg:col-span-2 border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden relative group">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">Team Performance</CardTitle>
                                <CardDescription>Monitor your assigned affiliates</CardDescription>
                            </div>
                            <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 flex items-center justify-center">
                                <Target size={20} />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500/20 transition-all">
                            <h4 className="font-bold text-sm mb-1 text-slate-900 dark:text-white">Team Size</h4>
                            <p className="text-2xl font-black text-indigo-600 mb-2">{teamStats.teamCount} Affiliates</p>
                            <Button asChild variant="outline" size="sm" className="w-full text-xs h-8">
                                <Link href="/team-leader/team">Manage Team</Link>
                            </Button>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/20 transition-all">
                            <h4 className="font-bold text-sm mb-1 text-slate-900 dark:text-white">Team Sales</h4>
                            <p className="text-2xl font-black text-emerald-600 mb-2">{teamStats.teamSalesCount} Total</p>
                            <Button asChild variant="outline" size="sm" className="w-full text-xs h-8">
                                <Link href="/leaderboard">Leaderboard</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                /* Regular Affiliate Quick Actions */
                <Card className="lg:col-span-2 border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden relative group">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold">Marketing Toolkit</CardTitle>
                        <CardDescription>Resources to help you grow your network</CardDescription>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#E87154]/20 transition-colors">
                            <div className="h-10 w-10 rounded-lg bg-[#E87154]/10 text-[#E87154] flex items-center justify-center mb-3">
                                <Zap size={20} />
                            </div>
                            <h4 className="font-bold text-sm mb-1">Brand Assets</h4>
                            <p className="text-xs text-slate-500 mb-3">Download logos and marketing images.</p>
                            <Button asChild variant="outline" size="sm" className="w-full text-xs h-8">
                                <Link href="/affiliate/marketing">Get Assets</Link>
                            </Button>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#E87154]/20 transition-colors">
                            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/10 text-blue-600 flex items-center justify-center mb-3">
                                <TrendingUp size={20} />
                            </div>
                            <h4 className="font-bold text-sm mb-1">Leaderboard</h4>
                            <p className="text-xs text-slate-500 mb-3">See how you rank against others.</p>
                            <Button asChild variant="outline" size="sm" className="w-full text-xs h-8">
                                <Link href="/leaderboard">View Rankings</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
      
        {/* Full-width Chart */}
        <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                    <CardTitle className="text-lg font-bold">Earnings Overview</CardTitle>
                    <CardDescription>Monthly earnings performance</CardDescription>
                </div>
                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#E87154]">
                    <TrendingUp size={16} />
                </div>
            </CardHeader>
            <CardContent>
                <EarningsChart data={chartData} />
            </CardContent>
        </Card>
        
        {/* Activities Table */}
        <DashboardTable
            title="Recent Activity"
            description="Latest actions and events"
            icon={<Clock size={18} />}
        >
            {activities.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-normal">
                  Start sharing LOFT with families to begin earning.
                </h3>
                <p className="text-stone-500 dark:text-slate-400 max-w-xs mx-auto text-xs sm:text-sm font-medium">Use your custom referral link to track and credit your sales automatically.</p>
                {user?.inviteCode && (
                  <div className="flex justify-center">
                    <CopyInviteLinkButton 
                      text={`${origin}/join/customer/${user.inviteCode}`} 
                      label="Share Link" 
                    />
                  </div>
                )}
              </div>
            ) : (
              <ActivityTable activities={activities} />
            )}
        </DashboardTable>

        {/* Support & FAQ block */}
        <div className="bg-stone-50 border border-stone-200 dark:bg-slate-900/50 dark:border-slate-800 rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-800 dark:text-white">Need Help?</h4>
            <p className="text-xs text-stone-500 dark:text-slate-400 font-semibold leading-relaxed">
              We’re here to help you every step of the way. Find quick answers to common questions in our Help Center.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button asChild variant="outline" className="rounded-xl h-10 px-5 text-xs font-bold border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-stone-50 dark:hover:bg-slate-800">
              <Link href="mailto:support@myloftstory.com" className="flex items-center justify-center gap-1.5">
                <MessageSquare size={13} /> Contact Support
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl h-10 px-5 text-xs font-bold border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-stone-50 dark:hover:bg-slate-800">
              <Link href="/faq">Visit Help Center</Link>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}


