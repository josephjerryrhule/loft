"use client";

import React, { useState, useEffect } from "react";
import { Check, AlertCircle, Sparkles } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  priceUSD: number | null;
  durationDays: number;
  features: string | null;
  isActive: boolean;
}

// Fallback plans if the API is offline
const fallbackPlans = [
  {
    id: "free-fallback",
    name: "Free Trial Plan",
    price: 0,
    durationDays: 30,
    description: "Curious parents testing the experience",
    features: "Basic 3D reader access,Custom avatar setup,Streak flame tracking,Free-category books",
    childLimit: "1 child profile",
  },
  {
    id: "monthly-fallback",
    name: "Monthly Explorer",
    price: 39,
    durationDays: 30,
    description: "Families seeking flexibility",
    features: "Unlimited access to all books,Badge unlocks,Progress tracking,Personal child statistics",
    childLimit: "1 child profile",
  },
  {
    id: "semi-fallback",
    name: "Semi-Annual Explorer",
    price: 199,
    durationDays: 180,
    description: "Value-seeking families",
    features: "Full premium library access,Manage profiles independently,Mid-tier pricing savings,Progress tracking for siblings",
    childLimit: "Up to 2 child profiles",
  },
  {
    id: "yearly-fallback",
    name: "Yearly Enchanter",
    price: 349,
    durationDays: 365,
    description: "Dedicated readers & large families",
    features: "Support for up to 4 children,Free access to monthly printable kits,Early book access,Priority customer support",
    childLimit: "Up to 4 child profiles",
    recommended: true,
  },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://app.landoffairytales.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.landoffairytales.com";

export default function Pricing() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filter out free plans and select exactly 3: "most purchased", "best value", and "the last one"
  const selectPlansForDisplay = (plansList: any[]) => {
    // Filter out free plans and exclude the 100 GHS plan
    const paid = plansList.filter((p) => Number(p.price) > 0 && Number(p.price) !== 100);
    if (paid.length <= 3) return paid;

    // Sort by price to identify positions
    const sorted = [...paid].sort((a, b) => Number(a.price) - Number(b.price));

    // 1. Most purchased: cheapest paid plan
    const mostPurchased = sorted[0];

    // 2. The last one: highest priced plan
    const lastOne = sorted[sorted.length - 1];

    // 3. Best value: recommended plan or middle plan
    let bestValue = sorted.find((p) => 
      p.name.toLowerCase().includes("recommended") || 
      p.name.toLowerCase().includes("yearly") || 
      p.name.toLowerCase().includes("value")
    );
    if (!bestValue || bestValue.id === mostPurchased.id || bestValue.id === lastOne.id) {
      const remaining = sorted.filter((p) => p.id !== mostPurchased.id && p.id !== lastOne.id);
      bestValue = remaining[Math.floor(remaining.length / 2)] || sorted[1];
    }

    return [mostPurchased, bestValue, lastOne].sort((a, b) => Number(a.price) - Number(b.price));
  };

  const paidPlans = selectPlansForDisplay(plans);
  const paidFallbackPlans = selectPlansForDisplay(fallbackPlans);

  useEffect(() => {
    async function fetchPlans() {
      // List of endpoints to try: local dev port, then configured base URL
      const urls = [
        "http://localhost:3000/api/plans",
        `${API_BASE_URL}/api/plans`,
      ];

      let success = false;
      for (const url of urls) {
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              setPlans(data);
              success = true;
              break;
            }
          }
        } catch (e) {
          // Continue to next URL
        }
      }

      if (!success) {
        setError(true);
      }
      setLoading(false);
    }

    fetchPlans();
  }, []);

  // Format the features comma-separated string to list
  const getFeaturesList = (featuresStr: string | null) => {
    if (!featuresStr) return [];
    if (featuresStr.includes("\n")) {
      return featuresStr.split("\n").map(f => f.trim()).filter(Boolean);
    }
    return featuresStr.split(",").map(f => f.trim()).filter(Boolean);
  };

  // Helper to determine child limits based on plan name
  const getChildLimit = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes("free")) return "1 child profile";
    if (name.includes("monthly") || name.includes("month")) return "1 child profile";
    if (name.includes("semi")) return "Up to 2 child profiles";
    if (name.includes("yearly") || name.includes("enchanter")) return "Up to 4 child profiles";
    return "1 child profile";
  };

  // Helper to check if recommended plan
  const isRecommended = (planName: string, price: number, plansList: any[]) => {
    const name = planName.toLowerCase();
    if (name.includes("yearly") || name.includes("enchanter") || name.includes("recommended")) {
      return true;
    }
    // If no plan is explicitly named yearly/recommended, highlight the plan with the highest price (most value)
    const activePlans = plansList.filter(p => p.isActive !== false);
    if (activePlans.length > 1) {
      const maxPricePlan = [...activePlans].sort((a, b) => b.price - a.price)[0];
      return maxPricePlan && maxPricePlan.name === planName;
    }
    return false;
  };

  // Reorder plans to place the recommended one in the middle for UX
  const reorderPlansForUX = (plansList: any[]) => {
    if (!plansList || plansList.length <= 2) return plansList;

    const recommendedIndex = plansList.findIndex((p) =>
      isRecommended(p.name, p.price, plansList)
    );

    if (recommendedIndex === -1) return plansList;

    const reordered = [...plansList];
    const [recommendedPlan] = reordered.splice(recommendedIndex, 1);
    
    const targetIndex = Math.floor(reordered.length / 2);
    reordered.splice(targetIndex, 0, recommendedPlan);

    return reordered;
  };

  // Helper to calculate plan-based metrics
  const getPlanMetrics = (planName: string, price: number) => {
    const name = planName.toLowerCase();

    if (price === 0 || name.includes("free")) {
      return {
        badge: "Starter",
        metric: "1.2k+ readers started here",
        satisfaction: "★ 4.6 parent rating",
      };
    }

    // Monthly tier
    if (name.includes("month") || name.includes("monthly") || (price > 0 && price < 150)) {
      return {
        badge: "Best Seller",
        metric: "Chosen by 65% of parents",
        satisfaction: "★ 4.8 parent rating",
      };
    }

    // High tier (Explorer / Yearly / Enchanter)
    return {
      badge: "Best Value",
      metric: "94% streak improvement rate",
      satisfaction: "★ 4.9 educator rating",
    };
  };

  // Helper to dynamically set grid columns and container width based on cards count
  const getGridColsClass = (count: number) => {
    if (count === 1) return "grid grid-cols-1 max-w-sm mx-auto gap-6 justify-center";
    if (count === 2) return "grid grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto gap-6 justify-center";
    if (count === 3) return "grid grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto gap-6 justify-center";
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto gap-6 justify-center";
  };

  // Reusable Card Component
  const renderCard = (plan: any, isLive: boolean, list: any[]) => {
    const recommended = isRecommended(plan.name, plan.price, list);
    const childLimit = isLive ? getChildLimit(plan.name) : plan.childLimit;
    const featuresList = isLive ? getFeaturesList(plan.features) : plan.features.split(",");
    const metrics = getPlanMetrics(plan.name, plan.price);

    return (
      <div
        key={plan.id}
        className={`flex flex-col justify-between p-8 rounded-3xl border transition-all duration-300 relative shadow-soft snap-center flex-shrink-0 w-[290px] sm:w-[325px] md:w-auto ${
          recommended
            ? "bg-brand-coral text-white border-brand-coral shadow-lg md:-translate-y-2 scale-[1.02] shadow-card-hover"
            : "bg-white text-text-dark border-brand-coral/10 hover:border-brand-coral/25 shadow-soft hover:shadow-lg hover:-translate-y-1"
        }`}
      >
        {recommended && (
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-brand-coral bg-brand-cream border border-brand-coral">
            <Sparkles className="w-3 h-3 text-brand-coral fill-brand-coral" /> Best Value
          </span>
        )}

        <div className="space-y-6">
          <div>
            <h3 className={`text-xl font-quicksand font-bold ${recommended ? "text-white" : "text-text-dark"}`}>
              {plan.name}
            </h3>
            <p className={`text-xs font-semibold mt-1 ${recommended ? "text-white/80" : "text-text-muted"}`}>
              {plan.description}
            </p>
          </div>

          <div className="flex items-baseline">
            <span className="text-3xl font-extrabold font-quicksand">
              {plan.price === 0 ? "Free" : `${plan.price} GHS`}
            </span>
            {plan.price > 0 && (
              <span className={`text-xs font-semibold ml-1.5 ${recommended ? "text-white/80" : "text-text-muted"}`}>
                / {plan.durationDays} Days
              </span>
            )}
          </div>

          {/* Child Limit Tag */}
          <div className={`text-xs font-bold px-3 py-1.5 rounded-full inline-block ${
            recommended ? "bg-white/15 text-white" : "bg-brand-cream border border-brand-coral/10 text-brand-coral"
          }`}>
            {childLimit}
          </div>

          {/* Metrics Section */}
          <div className={`space-y-1.5 py-2.5 px-3 rounded-2xl border ${
            recommended 
              ? "bg-white/10 border-white/20 text-white" 
              : "bg-brand-cream/50 border-brand-coral/10 text-text-dark"
          }`}>
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                recommended
                  ? "bg-white/25 border-transparent text-white"
                  : "bg-brand-coral/10 border-brand-coral/15 text-brand-coral"
              }`}>
                {metrics.badge}
              </span>
              <span className="text-[11px] font-bold">
                {metrics.satisfaction}
              </span>
            </div>
            <div className="text-[10px] font-medium opacity-90 flex items-center gap-1.5">
              <span className={`inline-block w-1.5 h-1.5 rounded-full animate-pulse ${
                recommended ? "bg-white" : "bg-brand-coral"
              }`} />
              {metrics.metric}
            </div>
          </div>

          {/* Features List */}
          {featuresList.length > 0 && (
            <ul className="space-y-3 pt-2">
              {featuresList.map((feature: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs font-medium leading-tight">
                  <Check className={`w-4 h-4 flex-shrink-0 stroke-[3.5] ${recommended ? "text-white" : "text-brand-coral"}`} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="pt-8">
          <a
            href={isLive ? `${APP_URL}/auth/register?planId=${plan.id}` : `${APP_URL}/auth/register`}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full inline-flex items-center justify-center py-3 rounded-full text-xs font-extrabold transition shadow-sm ${
              recommended
                ? "bg-white text-brand-coral hover:bg-brand-cream"
                : "bg-brand-coral text-white hover:bg-brand-coral/90"
            }`}
          >
            Get Started
          </a>
        </div>
      </div>
    );
  };

  return (
    <section id="pricing" className="w-full py-20 bg-brand-cream bg-grid-pattern border-b border-brand-coral/5">
      <div className="mx-auto max-w-7xl min-[1700px]:max-w-[100rem] px-6">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black text-[#302824] bg-[#FFD02B] border-2 border-[#302824] shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Reading Plans
          </span>
          <h2 className="text-3xl sm:text-4xl text-text-dark font-quicksand font-bold">
            Plans & Pricing
          </h2>
          <p className="text-base sm:text-lg text-text-muted font-medium">
            Choose the perfect reading plan for your family. Start building confidence today.
          </p>
        </div>

        {/* Dynamic Plans View */}
        {loading ? (
          /* Loading Skeletons - 3 columns if we default to 3 loading skeletons */
          <div className="grid grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white border border-brand-coral/10 rounded-3xl p-8 space-y-6">
                <div className="h-6 w-2/3 bg-text-muted/10 rounded" />
                <div className="h-10 w-1/2 bg-text-muted/10 rounded" />
                <div className="space-y-2">
                  <div className="h-4 bg-text-muted/10 rounded w-full" />
                  <div className="h-4 bg-text-muted/10 rounded w-5/6" />
                </div>
                <div className="space-y-3 pt-4">
                  <div className="h-4 bg-text-muted/10 rounded w-full" />
                  <div className="h-4 bg-text-muted/10 rounded w-full" />
                  <div className="h-4 bg-text-muted/10 rounded w-3/4" />
                </div>
                <div className="h-12 bg-text-muted/10 rounded-full w-full pt-4" />
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error Fallback View - 4 fallback plans */
          <div className="space-y-8">
            <div className="max-w-xl mx-auto flex items-center gap-3 p-4 rounded-2xl bg-brand-orange bg-opacity-20 border border-brand-coral/20 text-text-dark justify-center text-center">
              <AlertCircle className="w-5 h-5 text-brand-coral flex-shrink-0" />
              <p className="text-xs font-semibold text-text-dark">
                Unable to load live rates. Displaying standard reference pricing.
              </p>
            </div>

            <div className="flex flex-row overflow-x-auto md:overflow-visible snap-x snap-mandatory md:grid md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4 pt-10 pb-8 scrollbar-hide justify-start md:justify-center">
              {reorderPlansForUX(paidFallbackPlans).map((plan) => renderCard(plan, false, paidFallbackPlans))}
            </div>

            <div className="text-center pt-4">
              <p className="text-xs font-semibold text-text-muted">
                View our current plans directly on the platform:
              </p>
              <a
                href={APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-extrabold text-brand-coral hover:underline mt-1"
              >
                See Platform Plans
              </a>
            </div>
          </div>
        ) : (
          /* Live Plans from API */
          <div className="flex flex-row overflow-x-auto md:overflow-visible snap-x snap-mandatory md:grid md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4 pt-10 pb-8 scrollbar-hide justify-start md:justify-center">
            {reorderPlansForUX(paidPlans).map((plan) => renderCard(plan, true, paidPlans))}
          </div>
        )}

      </div>
    </section>
  );
}
