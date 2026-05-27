"use client";

import React, { useState } from "react";
import { Users, DollarSign, Wallet, Clock, Zap, Target, TrendingUp, ArrowRight, ShieldCheck, User } from "lucide-react";

type TabKey = "overview" | "earnings" | "toolkit" | "team" | "payouts";

export default function Ambassador() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "earnings", label: "Earnings" },
    { key: "toolkit", label: "Toolkit" },
    { key: "team", label: "Team Tree" },
    { key: "payouts", label: "MOMO Payouts" },
  ];

  return (
    <section id="ambassador" className="w-full py-20 bg-white border-b border-brand-coral/5 overflow-hidden">
      <div className="mx-auto max-w-7xl min-[1700px]:max-w-[100rem] px-6">
        
        {/* Title Section */}
        <div className="max-w-3xl mx-auto text-center mb-10 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black text-[#302824] bg-[#B8D3E5] border-2 border-[#302824] shadow-sm">
            <Users className="w-3.5 h-3.5" />
            Ambassador Network
          </span>
          <h2 className="text-3xl sm:text-4xl text-text-dark font-quicksand font-bold">
            Everything You Need To Grow As A LOFT Ambassador
          </h2>
          <p className="text-base sm:text-lg text-text-muted font-medium">
            From real-time commission tracking and marketing assets to community payouts, LOFT covers the full operational surface.
          </p>
        </div>

        {/* Tab Row (pill bar) - Center aligned */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-brand-coral/5 max-w-full overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabKey)}
                className={`py-2.5 px-5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-white text-brand-coral shadow-sm border border-brand-coral/5"
                    : "text-text-muted hover:text-text-dark"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Feature Lists (Col span 5) */}
          <div className="lg:col-span-5 flex flex-col h-full">
            {activeTab === "overview" && (
              <div className="p-8 rounded-3xl border-2 border-[#302824] bg-brand-blue flex-1 flex flex-col justify-between shadow-soft">
                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border-2 border-[#302824] text-text-dark shadow-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-quicksand font-bold text-text-dark">
                    Dashboard Overview
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-sm text-text-dark mb-1">Automated Tracking</h4>
                      <p className="text-xs font-semibold text-text-muted leading-relaxed">
                        Instantly monitor every family profile created, subscription signup, and commission conversion linked to your name.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-dark mb-1">Active Metrics</h4>
                      <p className="text-xs font-semibold text-text-muted leading-relaxed">
                        Keep track of referral visitor click rates and customer retention stats to optimize your campaign outreach.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-dark mb-1">Activity Log</h4>
                      <p className="text-xs font-semibold text-text-muted leading-relaxed">
                        A clear, chronological ledger of all events happening inside your network.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 mt-6 border-t-2 border-[#302824]/10">
                  <a
                    href="https://app.landoffairytales.com/join"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-bold text-white bg-brand-coral hover:bg-brand-coral/90 transition shadow-soft hover:-translate-y-0.5"
                  >
                    <span>Become An Ambassador</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 flex-shrink-0" />
                  </a>
                </div>
              </div>
            )}

            {activeTab === "earnings" && (
              <div className="p-8 rounded-3xl border-2 border-[#302824] bg-brand-purple flex-1 flex flex-col justify-between shadow-soft">
                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border-2 border-[#302824] text-text-dark shadow-sm">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-quicksand font-bold text-text-dark">
                    Real-Time Earnings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-sm text-text-dark mb-1">Approved Balance</h4>
                      <p className="text-xs font-semibold text-text-muted leading-relaxed">
                        Earnings that have completed verification cycles and are ready for mobile money payouts.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-dark mb-1">Pending Balance</h4>
                      <p className="text-xs font-semibold text-text-muted leading-relaxed">
                        Newly referred checkout transactions waiting for validation checkmarks.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-dark mb-1">Growth Trends</h4>
                      <p className="text-xs font-semibold text-text-muted leading-relaxed">
                        Monthly overview charts tracking commission performance to visualize your networking success.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t-2 border-[#302824]/10">
                  <a
                    href="https://app.landoffairytales.com/join"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-bold text-white bg-brand-coral hover:bg-brand-coral/90 transition shadow-soft hover:-translate-y-0.5"
                  >
                    <span>Become An Ambassador</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 flex-shrink-0" />
                  </a>
                </div>
              </div>
            )}

            {activeTab === "toolkit" && (
              <div className="p-8 rounded-3xl border-2 border-[#302824] bg-brand-green flex-1 flex flex-col justify-between shadow-soft">
                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border-2 border-[#302824] text-text-dark shadow-sm">
                    <Zap className="w-6 h-6 text-brand-coral" />
                  </div>
                  <h3 className="text-2xl font-quicksand font-bold text-text-dark">
                    Promoter Toolkit
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-sm text-text-dark mb-1">Unique Invite Links</h4>
                      <p className="text-xs font-semibold text-text-muted leading-relaxed">
                        Copy secure referral links to share via messaging apps and social media, ensuring all signups route to your account.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-dark mb-1">Custom QR Badges</h4>
                      <p className="text-xs font-semibold text-text-muted leading-relaxed">
                        Download printable codes tailored to your ID. Perfect for flyers, notice boards, and school events.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-dark mb-1">Secure Scan-to-Verify</h4>
                      <p className="text-xs font-semibold text-text-muted leading-relaxed">
                        Any parent can scan your ID badge to confirm your active authorization in the database, building immediate trust.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t-2 border-[#302824]/10">
                  <a
                    href="https://app.landoffairytales.com/join"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-bold text-white bg-brand-coral hover:bg-brand-coral/90 transition shadow-soft hover:-translate-y-0.5"
                  >
                    <span>Become An Ambassador</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 flex-shrink-0" />
                  </a>
                </div>
              </div>
            )}

            {activeTab === "team" && (
              <div className="p-8 rounded-3xl border-2 border-[#302824] bg-brand-orange flex-1 flex flex-col justify-between shadow-soft">
                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border-2 border-[#302824] text-text-dark shadow-sm">
                    <Target className="w-6 h-6 text-brand-coral" />
                  </div>
                  <h3 className="text-2xl font-quicksand font-bold text-text-dark">
                    Team Leader Overrides
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-sm text-text-dark mb-1">Hierarchical Tree overrides</h4>
                      <p className="text-xs font-semibold text-text-muted leading-relaxed">
                        Earn standard 20% direct commissions, plus up to 3% downline overrides when affiliates in your group register customers.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-dark mb-1">Team Leaderboards</h4>
                      <p className="text-xs font-semibold text-text-muted leading-relaxed">
                        Monitor top-performing affiliates in your team tree to coordinate local community literacy drives.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-dark mb-1">Group Management</h4>
                      <p className="text-xs font-semibold text-text-muted leading-relaxed">
                        A central team panel to manage promoter promoter onboarding pipelines in Ghana and beyond.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t-2 border-[#302824]/10">
                  <a
                    href="https://app.landoffairytales.com/join"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-bold text-white bg-brand-coral hover:bg-brand-coral/90 transition shadow-soft hover:-translate-y-0.5"
                  >
                    <span>Become An Ambassador</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 flex-shrink-0" />
                  </a>
                </div>
              </div>
            )}

            {activeTab === "payouts" && (
              <div className="p-8 rounded-3xl border-2 border-[#302824] bg-[#E87154]/20 flex-1 flex flex-col justify-between shadow-soft">
                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border-2 border-[#302824] text-text-dark shadow-sm">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-quicksand font-bold text-text-dark">
                    Weekly MoMo Settlements
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-sm text-text-dark mb-1">Direct MoMo Transfers</h4>
                      <p className="text-xs font-semibold text-text-muted leading-relaxed">
                        Secure weekly payout settlements processed directly into your MTN Mobile Money, Telecel Cash, or AT Money wallet.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-dark mb-1">Low Thresholds</h4>
                      <p className="text-xs font-semibold text-text-muted leading-relaxed">
                        Initiate secure payout requests from your dashboard as soon as your approved balance crosses the minimum limit.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-dark mb-1">Weekly Disbursement Runs</h4>
                      <p className="text-xs font-semibold text-text-muted leading-relaxed">
                        All approved statements are finalized and transferred every Friday morning.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t-2 border-[#302824]/10">
                  <a
                    href="https://app.landoffairytales.com/join"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-bold text-white bg-brand-coral hover:bg-brand-coral/90 transition shadow-soft hover:-translate-y-0.5"
                  >
                    <span>Become An Ambassador</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 flex-shrink-0" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Interactive App Dashboard Mockups (Col span 7) */}
          <div className="lg:col-span-7 flex flex-col h-full">
            
            {/* Dashboard Mockup Outer Container */}
            <div className="w-full h-full border-[3px] border-[#302824] rounded-3xl bg-[#FAF5EF] p-6 sm:p-8 shadow-soft select-none overflow-hidden relative flex flex-col justify-center">
              <div className="absolute top-2 right-4 flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400 border border-[#302824]" />
                <span className="w-3 h-3 rounded-full bg-yellow-400 border border-[#302824]" />
                <span className="w-3 h-3 rounded-full bg-green-400 border border-[#302824]" />
              </div>

              {/* MOCKUP CONTENT BASED ON TABS */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Mockup Header */}
                  <div className="flex justify-between items-center pb-4 border-b border-[#302824]/10">
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#E87154] tracking-widest">Ambassador Workspace</span>
                      <h4 className="text-lg font-bold text-text-dark font-quicksand">Kofi Mensah</h4>
                    </div>
                    <span className="text-[10px] font-bold px-3 py-1 bg-brand-purple/20 border border-brand-purple/40 text-text-dark rounded-full">
                      Team Leader
                    </span>
                  </div>

                  {/* Mockup KPI Cards Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white border border-[#302824]/10 p-3 rounded-2xl shadow-sm space-y-1">
                      <span className="text-[9px] font-bold text-text-muted uppercase">My Referrals</span>
                      <p className="text-lg font-black text-text-dark leading-none">18 Parents</p>
                    </div>
                    <div className="bg-white border border-[#302824]/10 p-3 rounded-2xl shadow-sm space-y-1">
                      <span className="text-[9px] font-bold text-text-muted uppercase">Approved</span>
                      <p className="text-lg font-black text-emerald-600 leading-none">GHS 120.00</p>
                    </div>
                    <div className="bg-white border border-[#302824]/10 p-3 rounded-2xl shadow-sm space-y-1">
                      <span className="text-[9px] font-bold text-text-muted uppercase">Total Earned</span>
                      <p className="text-lg font-black text-text-dark leading-none">GHS 780.00</p>
                    </div>
                  </div>

                  {/* Mockup Table */}
                  <div className="bg-white border border-[#302824]/10 rounded-2xl p-4 space-y-3">
                    <h5 className="text-[10px] font-black text-text-dark uppercase tracking-wider pb-2 border-b border-[#302824]/5 flex items-center justify-between">
                      <span>Recent Activity</span>
                      <span className="text-[9px] font-bold text-brand-coral cursor-pointer">View All</span>
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <p className="font-bold text-text-dark">Parent signup via QR</p>
                          <p className="text-[9px] font-bold text-text-muted">10 minutes ago</p>
                        </div>
                        <span className="font-black text-emerald-600 text-xs">+ GHS 7.80</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-2 border-t border-[#302824]/5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-text-dark">Parent signup via Link</p>
                          <p className="text-[9px] font-bold text-text-muted">2 hours ago</p>
                        </div>
                        <span className="font-black text-emerald-600 text-xs">+ GHS 7.80</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-2 border-t border-[#302824]/5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-text-dark">Monthly Checkout Renewal</p>
                          <p className="text-[9px] font-bold text-text-muted">1 day ago</p>
                        </div>
                        <span className="font-black text-emerald-600 text-xs">+ GHS 39.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "earnings" && (
                <div className="space-y-6">
                  {/* Mockup Header */}
                  <div className="flex justify-between items-center pb-4 border-b border-[#302824]/10">
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#E87154] tracking-widest">Earnings Analytics</span>
                      <h4 className="text-lg font-bold text-text-dark font-quicksand">Monthly Earnings overview</h4>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <TrendingUp className="w-3 h-3" /> Rising
                    </div>
                  </div>

                  {/* SVG Mockup Line Chart */}
                  <div className="bg-white border border-[#302824]/10 rounded-2xl p-4 space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-bold text-text-muted">
                      <span>Monthly Commission Performance</span>
                      <span className="text-text-dark">GHS 120.00 to GHS 780.00</span>
                    </div>
                    {/* SVG Chart Drawing */}
                    <svg viewBox="0 0 300 120" className="w-full h-32 overflow-visible">
                      {/* Grid Lines */}
                      <line x1="0" y1="20" x2="300" y2="20" stroke="#302824" strokeWidth="0.5" strokeDasharray="3" opacity="0.1" />
                      <line x1="0" y1="60" x2="300" y2="60" stroke="#302824" strokeWidth="0.5" strokeDasharray="3" opacity="0.1" />
                      <line x1="0" y1="100" x2="300" y2="100" stroke="#302824" strokeWidth="0.5" strokeDasharray="3" opacity="0.1" />
                      
                      {/* Line Trend Curve */}
                      <path
                        d="M 10 100 Q 80 80, 120 70 T 220 30 T 290 10"
                        fill="none"
                        stroke="#E87154"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      
                      {/* Dots and Labels */}
                      <circle cx="10" cy="100" r="3" fill="#302824" />
                      <circle cx="120" cy="70" r="4" fill="#E87154" stroke="#FFFFFF" strokeWidth="1.5" />
                      <circle cx="290" cy="10" r="4" fill="#E87154" stroke="#FFFFFF" strokeWidth="1.5" />
                      
                      <text x="10" y="115" fontSize="8" fontWeight="bold" fill="#64748B" textAnchor="middle">Jan</text>
                      <text x="80" y="115" fontSize="8" fontWeight="bold" fill="#64748B" textAnchor="middle">Feb</text>
                      <text x="150" y="115" fontSize="8" fontWeight="bold" fill="#64748B" textAnchor="middle">Mar</text>
                      <text x="220" y="115" fontSize="8" fontWeight="bold" fill="#64748B" textAnchor="middle">Apr</text>
                      <text x="290" y="115" fontSize="8" fontWeight="bold" fill="#64748B" textAnchor="middle">May</text>
                    </svg>
                  </div>
                  
                  {/* Balance rows */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-2xl border border-[#302824]/10 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-text-muted">Approved Balance</span>
                      <span className="text-sm font-black text-emerald-600">GHS 120.00</span>
                    </div>
                    <div className="p-3 bg-white rounded-2xl border border-[#302824]/10 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-text-muted">Pending Balance</span>
                      <span className="text-sm font-black text-amber-600">GHS 80.00</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "toolkit" && (
                <div className="space-y-6 flex flex-col items-center">
                  {/* Mockup Header */}
                  <div className="w-full pb-4 border-b border-[#302824]/10 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#E87154] tracking-widest">Verification Module</span>
                      <h4 className="text-lg font-bold text-text-dark font-quicksand">Official ID Badge Mockup</h4>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Approved
                    </span>
                  </div>

                  {/* Plastic ID badge mockup */}
                  <div className="w-full max-w-[280px] rounded-2xl border-[3px] border-[#302824] bg-white shadow-md p-5 flex flex-col justify-between items-center relative space-y-4">
                    {/* Badge top clip slot */}
                    <div className="w-12 h-3 bg-slate-200 border border-[#302824]/30 rounded-full" />
                    
                    {/* Photo placeholder */}
                    <div className="w-20 h-20 rounded-full bg-brand-cream border-2 border-[#302824] overflow-hidden flex items-center justify-center text-[#302824]">
                      <User className="w-10 h-10" />
                    </div>

                    {/* Member Details */}
                    <div className="text-center space-y-1">
                      <h5 className="font-quicksand font-bold text-sm text-text-dark">Kofi Mensah</h5>
                      <p className="text-[9px] font-black uppercase text-brand-coral tracking-widest leading-none">LFT-AMB-108</p>
                      <p className="text-[8px] font-bold text-text-muted">Team Leader & promoter</p>
                    </div>

                    {/* Verification Status box */}
                    <div className="w-full py-1.5 rounded-lg bg-brand-green/20 border border-brand-green/40 text-center">
                      <span className="text-[9px] font-extrabold text-text-dark tracking-wide flex items-center justify-center gap-1">
                        Verified active LOFT Ambassador
                      </span>
                    </div>

                    {/* QR Code placeholder */}
                    <div className="w-16 h-16 border-2 border-[#302824] rounded-lg p-1 bg-slate-50 flex items-center justify-center">
                      {/* Simple mock QR pattern */}
                      <svg viewBox="0 0 40 40" className="w-full h-full text-text-dark">
                        <rect x="0" y="0" width="12" height="12" fill="currentColor" />
                        <rect x="28" y="0" width="12" height="12" fill="currentColor" />
                        <rect x="0" y="28" width="12" height="12" fill="currentColor" />
                        <rect x="16" y="16" width="8" height="8" fill="currentColor" />
                        <rect x="28" y="28" width="6" height="6" fill="currentColor" />
                        <rect x="18" y="4" width="4" height="4" fill="currentColor" />
                        <rect x="4" y="18" width="4" height="4" fill="currentColor" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "team" && (
                <div className="space-y-6">
                  {/* Mockup Header */}
                  <div className="flex justify-between items-center pb-4 border-b border-[#302824]/10">
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#E87154] tracking-widest">Team Performance</span>
                      <h4 className="text-lg font-bold text-text-dark font-quicksand">Promoter Leaderboard</h4>
                    </div>
                    <span className="text-[10px] font-bold text-[#E87154] bg-brand-coral/10 px-2 py-0.5 rounded-full">Active Supervisors</span>
                  </div>

                  {/* Leaderboard Table Mockup */}
                  <div className="bg-white border border-[#302824]/10 rounded-2xl p-4">
                    <table className="w-full text-left text-xs font-semibold">
                      <thead>
                        <tr className="border-b border-[#302824]/10 text-[9px] uppercase tracking-wider text-text-muted">
                          <th className="pb-2">Promoter</th>
                          <th className="pb-2 text-center">Referrals</th>
                          <th className="pb-2 text-right">Commissions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#302824]/5">
                        <tr>
                          <td className="py-2.5 font-bold text-text-dark">Kwame Owusu</td>
                          <td className="py-2.5 text-center text-text-muted">48 parents</td>
                          <td className="py-2.5 text-right text-emerald-600 font-extrabold">GHS 1,872.00</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold text-text-dark">Ama Darko</td>
                          <td className="py-2.5 text-center text-text-muted">35 parents</td>
                          <td className="py-2.5 text-right text-emerald-600 font-extrabold">GHS 1,365.00</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold text-text-dark">Kojo Mensah</td>
                          <td className="py-2.5 text-center text-text-muted">24 parents</td>
                          <td className="py-2.5 text-right text-emerald-600 font-extrabold">GHS 936.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "payouts" && (
                <div className="space-y-6">
                  {/* Mockup Header */}
                  <div className="flex justify-between items-center pb-4 border-b border-[#302824]/10">
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#E87154] tracking-widest">Automatic Payout Settings</span>
                      <h4 className="text-lg font-bold text-text-dark font-quicksand">Settlement Statements</h4>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded-full">MOMO Configured</span>
                  </div>

                  {/* MOMO details box */}
                  <div className="p-4 rounded-2xl bg-white border border-[#302824]/10 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase tracking-wider text-text-muted">Registered Payout Method</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-brand-green/20 text-text-dark">Active</span>
                    </div>
                    <p className="text-base font-black text-text-dark leading-none">Mobile Money (MTN MoMo)</p>
                    <p className="text-xs font-mono text-text-muted">054*****89 (Kofi Mensah)</p>
                  </div>

                  {/* Payout statements list */}
                  <div className="bg-white border border-[#302824]/10 rounded-2xl p-4 space-y-2">
                    <span className="block text-[9px] font-black uppercase tracking-wider text-text-muted pb-1.5 border-b border-[#302824]/5">Payout History</span>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-text-dark">Statement #294</p>
                          <p className="text-[9px] font-bold text-text-muted">May 25, 2026</p>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-text-dark">GHS 350.00</span>
                          <span className="block text-[8px] font-extrabold text-emerald-600">Approved</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-2 border-t border-[#302824]/5">
                        <div>
                          <p className="font-bold text-text-dark">Statement #283</p>
                          <p className="text-[9px] font-bold text-text-muted">May 18, 2026</p>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-text-dark">GHS 240.00</span>
                          <span className="block text-[8px] font-extrabold text-emerald-600">Approved</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
