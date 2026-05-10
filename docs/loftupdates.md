# LOFT Platform Update & Subscription Structure Review

Hi Joseph,

We’ve identified a few important platform and subscription structure issues following a recent update to the LOFT reading ecosystem, and I wanted to properly document them for review and advice on the best way to implement the fixes.

---

# Background

Originally, the LOFT platform was built around a single library/product category called “365,” which covered children roughly between ages 0–8.

However, after further testing and observation, we realized that age range is too broad for the reading experience and content structure we want to provide.

We have now split the ecosystem into 3 separate age groups:

## 1. Little Lofters
Age Group: 0–3 years

## 2. LOFT 365
Age Group: 4–7 years

## 3. Big Readers
Age Group: 8+ years

This means we now have different libraries/content ecosystems for different age groups instead of one shared library.

---

# Current Platform Issues Identified

## Issue 1 — Subscription Sharing Between Multiple Children

Right now, the system allows one parent to purchase a single subscription and then share access across multiple children.

Example:
- Parent pays for 1 subscription
- Has 3 children
- All 3 children can currently access the books using the same account/subscription

The problem is that the subscription model is intended to be PER CHILD, not per household account.

So ideally:
- Each child/profile should require its own active subscription/access entitlement
- OR there should be a structured family plan/multi-child system if we decide to support that intentionally later.

At the moment, the current setup unintentionally gives free access to additional children.

We need advice on:
- The best way to technically structure subscriptions per child
- Whether child profiles should exist under a parent account
- How access control should work
- Whether a “family subscription” model should exist
- The cleanest/scalable architecture for this moving forward

---

## Issue 2 — Age Group / Library Access Control

Currently, once a user subscribes, they automatically gain access to everything on the platform.

This worked when there was only one library (365), but now we have multiple age-based ecosystems.

We now need a way to determine WHICH library/library set a child should access.

Possible approaches we considered:
- Age selection during signup
- Child profile creation during onboarding
- Subscription tied to selected age group
- Ability for parents to manage multiple child profiles with different age groups

Example:
- Child A (2 years old) → Access only to Little Lofters
- Child B (6 years old) → Access only to 365
- Child C (10 years old) → Access only to Big Readers

Currently, the platform does not support this separation.

---

## Issue 3 — Regional Pricing & Currency Localization

We also need the platform to support regional pricing and currency localization.

We’re already receiving interest from users outside Ghana, so the subscription/payment system needs to adapt based on the user’s region or country.

Important clarification:
This is NOT simply about converting one fixed Ghana price into another currency using exchange rates.

Instead, we want the ability to set DIFFERENT ACTUAL PRICES for different regions/countries.

Example (illustrative only):
- Ghana → GHS pricing
- USA → USD pricing
- UK → GBP pricing
- Other regions → localized pricing structures

Meaning:
- Different countries/regions may have completely different subscription amounts
- Pricing should be strategically adjustable per market
- Currency display and checkout should match the region

This should apply to:
- Subscription pricing display
- Checkout/payment flow
- Billing currency
- Subscription plans/packages

We’d appreciate advice on:
- The best way to structure region-based pricing
- How to detect user location/country reliably
- Whether pricing rules should be country-based or region-based
- How admins should manage/update regional pricing
- Which payment providers/gateways best support this setup
- The most scalable architecture for future international growth

The goal is to:
- Create a smoother experience for international users
- Allow flexible market-based pricing
- Maintain affordability in different regions
- Support global expansion properly from the beginning

---

# What We Need Advice On

We’d appreciate your recommendations on:

1. The best technical architecture for handling:
   - Parent accounts
   - Child profiles
   - Per-child subscriptions
   - Age-based access control

2. The cleanest way to integrate age selection/onboarding into the current platform

3. Whether access should be:
   - Automatically age-restricted
   - Manually selectable by parents
   - Subscription-tier based
   - Profile-based

4. The best long-term scalable approach as LOFT grows

5. How difficult these changes would be to implement within the current system

6. Any security or abuse-prevention measures we should consider to reduce subscription sharing

7. The best approach for region-based pricing and international payment handling

---

# Urgency / Timeline

This is fairly urgent because we’ll be starting LOFT Ambassador training next week.

The platform needs to be stable, functional, and properly structured before then so:
- We can confidently train ambassadors on how the system works
- Demonstrations during training go smoothly
- There are no major subscription/access glitches during onboarding
- Ambassadors clearly understand the user flow and library structure

Ideally, we’d like to identify:
- What can realistically be completed before training
- What temporary/immediate fixes can be implemented quickly
- What longer-term improvements can be phased in afterward if necessary

Please advise on the fastest and most effective implementation approach considering the timeline.

---

# Goal

The goal is to:
- Properly separate the LOFT reading ecosystem by age group
- Ensure subscriptions are fairly structured per child
- Prevent unintended free sharing of paid access
- Create a scalable foundation for future LOFT growth
- Support international expansion and regional pricing properly

Please review and advise on:
- The best way to approach this technically
- Suggested structure/workflow
- Recommended implementation order
- Any better alternatives we may not be considering

Thanks.
