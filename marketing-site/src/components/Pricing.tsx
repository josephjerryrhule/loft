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

export default function Pricing() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchPlans() {
      // List of endpoints to try: local dev port, then prod domain
      const urls = [
        "http://localhost:3000/api/plans",
        "https://app.landoffairytales.com/api/plans",
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
    // Try split by comma or newline
    if (featuresStr.includes("\n")) {
      return featuresStr.split("\n").map(f => f.trim()).filter(Boolean);
    }
    return featuresStr.split(",").map(f => f.trim()).filter(Boolean);
  };

  // Helper to determine child limits based on plan name
  const getChildLimit = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes("free")) return "1 child profile";
    if (name.includes("monthly")) return "1 child profile";
    if (name.includes("semi")) return "Up to 2 child profiles";
    if (name.includes("yearly") || name.includes("enchanter")) return "Up to 4 child profiles";
    return "1 child profile";
  };

  // Helper to check if recommended plan
  const isRecommended = (planName: string) => {
    const name = planName.toLowerCase();
    return name.includes("yearly") || name.includes("enchanter") || name.includes("recommended");
  };

  return (
    <section id="pricing" className="w-full py-20 bg-brand-cream bg-grid-pattern border-b border-brand-coral/5">
      <div className="mx-auto max-w-7xl min-[1700px]:max-w-[100rem] px-6">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-brand-coral bg-brand-coral/5 border border-brand-coral/10">
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
          /* Loading Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
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
          /* Error Fallback View */
          <div className="space-y-8">
            <div className="max-w-xl mx-auto flex items-center gap-3 p-4 rounded-2xl bg-brand-orange bg-opacity-20 border border-brand-coral/20 text-text-dark justify-center text-center">
              <AlertCircle className="w-5 h-5 text-brand-coral flex-shrink-0" />
              <p className="text-xs font-semibold text-text-dark">
                Unable to load live rates. Displaying standard reference pricing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {fallbackPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`flex flex-col justify-between p-8 rounded-3xl border transition-all ${
                    plan.recommended
                      ? "bg-brand-coral text-white border-brand-coral shadow-lg relative transform md:-translate-y-2 scale-[1.02]"
                      : "bg-white text-text-dark border-brand-coral/10 shadow-soft"
                  }`}
                >
                  {plan.recommended && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-brand-coral bg-brand-cream border border-brand-coral">
                      <Sparkles className="w-3 h-3 text-brand-coral fill-brand-coral" /> Best Value
                    </span>
                  )}

                  <div className="space-y-6">
                    <div>
                      <h3 className={`text-xl font-quicksand font-bold ${plan.recommended ? "text-white" : "text-text-dark"}`}>
                        {plan.name}
                      </h3>
                      <p className={`text-xs font-semibold mt-1 ${plan.recommended ? "text-white/80" : "text-text-muted"}`}>
                        {plan.description}
                      </p>
                    </div>

                    <div className="flex items-baseline">
                      <span className="text-3xl font-extrabold font-quicksand">
                        {plan.price === 0 ? "Free" : `${plan.price} GHS`}
                      </span>
                      {plan.price > 0 && (
                        <span className={`text-xs font-semibold ml-1.5 ${plan.recommended ? "text-white/80" : "text-text-muted"}`}>
                          / {plan.durationDays} Days
                        </span>
                      )}
                    </div>

                    {/* child limit tag */}
                    <div className={`text-xs font-bold px-3 py-1.5 rounded-full inline-block ${plan.recommended ? "bg-white/10 text-white" : "bg-brand-cream border border-brand-coral/10 text-brand-coral"}`}>
                      {plan.childLimit}
                    </div>

                    {/* Features list */}
                    <ul className="space-y-3 pt-2">
                      {plan.features.split(",").map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs font-medium leading-tight">
                          <Check className={`w-4 h-4 flex-shrink-0 stroke-[3.5] ${plan.recommended ? "text-white" : "text-brand-coral"}`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8">
                    <a
                      href="https://app.landoffairytales.com/signup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full inline-flex items-center justify-center py-3 rounded-full text-xs font-extrabold transition shadow-sm ${
                        plan.recommended
                          ? "bg-white text-brand-coral hover:bg-brand-cream"
                          : "bg-brand-coral text-white hover:bg-brand-coral/90"
                      }`}
                    >
                      Get Started
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-4">
              <p className="text-xs font-semibold text-text-muted">
                View our current plans directly on the platform:
              </p>
              <a
                href="https://app.landoffairytales.com"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const recommended = isRecommended(plan.name);
              const childLimit = getChildLimit(plan.name);
              const featuresList = getFeaturesList(plan.features);

              return (
                <div
                  key={plan.id}
                  className={`flex flex-col justify-between p-8 rounded-3xl border transition-all ${
                    recommended
                      ? "bg-brand-coral text-white border-brand-coral shadow-lg relative transform md:-translate-y-2 scale-[1.02]"
                      : "bg-white text-text-dark border-brand-coral/10 shadow-soft"
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
                    <div className={`text-xs font-bold px-3 py-1.5 rounded-full inline-block ${recommended ? "bg-white/10 text-white" : "bg-brand-cream border border-brand-coral/10 text-brand-coral"}`}>
                      {childLimit}
                    </div>

                    {/* Features List */}
                    {featuresList.length > 0 && (
                      <ul className="space-y-3 pt-2">
                        {featuresList.map((feature, idx) => (
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
                      href="https://app.landoffairytales.com/signup"
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
            })}
          </div>
        )}

      </div>
    </section>
  );
}
