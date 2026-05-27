# LOFT — Marketing Website Brief
**Prepared for:** Antigravity
**Project:** LOFT Platform
**Scope:** Public-facing marketing website (pre-login only)
**Structure:** Single-page (one-pager with anchor navigation)
**Stack:** Next.js
**Version:** 1.1

---

## 1. Overview & Objective

The current LOFT platform has no unified public-facing home. Users access different portals through separate links, and there is no marketing surface that introduces LOFT, builds trust with parents, converts visitors into subscribers, or recruits ambassadors.

This task is to design and build that marketing website as a single-page experience.

The website must function simultaneously as:

- A brand introduction and trust-building surface for new visitors
- A sales and conversion engine for subscriptions and birthday books
- An ambassador recruitment surface
- A gateway that routes existing users into the correct portal without needing to remember separate URLs
- The canonical LOFT web presence

> **Scope note:** This task covers the public-facing one-pager only (pre-login). Post-login dashboards, onboarding flows, role-based routing, and in-app navigation are covered in a separate task. Login and signup are owned by the platform — the marketing site navigates to them but does not contain them.

---

## 2. Brand & Tone

| Attribute | Direction |
|---|---|
| Positioning | Premium, magical, culturally rooted, confidence-building |
| Tone | Warm, inspiring, child-friendly, trustworthy, aspirational |
| Audience (primary) | Parents of young readers |
| Audience (secondary) | Prospective ambassadors |
| Visual feel | Joyful, premium, culturally grounded — not generic stock |
| Cultural direction | African/Ghana-inspired warmth, familiar environments, imaginative reinterpretations |

### Core Messaging Pillars
1. Confidence building
2. Reading habit formation
3. Interactive magical learning
4. Stories rooted in culture, identity, and imagination
5. Parent trust and child excitement

---

## 3. Navigation

All nav items are anchor links scrolling to sections on the same page, except Login which routes externally to the platform.

| Label | Target |
|---|---|
| Home | `#hero` |
| About LOFT | `#about` |
| Products | `#products` |
| Plans & Pricing | `#pricing` |
| Ambassador Programme | `#ambassador` |
| Login | External → `https://app.landoffairytales.com` |

**Mobile navigation:**
- Hamburger menu with same items
- "Login" always visible as a sticky button at top right
- Smooth scroll behaviour on all anchor links

---

## 4. Page Sections

---

### Section 1 — Hero
`#hero`

> **Purpose:** Immediately explain what LOFT is, emotionally connect with parents, communicate trust, and encourage action.

**Headline:**
> Build Confidence Through Stories That Feel Like Home

**Subheadline:**
> Interactive reading adventures children love, rooted in culture, imagination, and confidence-building.
> From magical storybooks and personalized birthday stories to habit-forming reading experiences, LOFT helps children grow while parents feel confident about every minute spent learning.

**CTAs:**
- Primary: `Start Your Journey` → External link to platform signup
- Secondary: `Explore LOFT` → Scrolls to `#about`

**Trust indicators (short checkmark row):**
- Child-friendly learning
- Confidence-building stories
- Interactive reading experiences
- Personalized books and learning tools

**Visual:**
> `[PLACEHOLDER — Hero image or illustration]`
> Concept: A child reading while story worlds come alive around them.
> Style: Magical, warm, premium, culturally grounded. Subtly include imagination, African/Ghana-inspired warmth, joyful discovery, and familiar environments.

---

### Section 2 — What Is LOFT?
`#about`

> **Purpose:** Quickly explain what LOFT is without overwhelming users.

**Section title:**
> More Than Reading. A World Of Confidence, Culture & Imagination.

**Body copy:**
> LOFT is an interactive reading platform and educational experience designed to help children fall in love with reading while building confidence, curiosity, and imagination.
>
> Through interactive story experiences, personalized books, engaging reading journeys, and culturally meaningful storytelling, children explore adventures that feel exciting, familiar, and inspiring.
>
> At LOFT, we believe children should see themselves reflected in the stories they read — in the people, places, names, values, and possibilities they encounter.
>
> Whether it's reading independently, exploring magical adventures, or becoming the hero of a personalized birthday storybook, LOFT transforms reading into something children genuinely look forward to.

**Feature bullets:**
- Interactive reading adventures
- Stories rooted in culture and imagination
- Personalized birthday books
- Reading habit and confidence building
- Parent-friendly progress tools

**CTA:** `Explore Experiences` → Scrolls to `#products`

---

### Section 3 — Why Families Love LOFT

> **Purpose:** Communicate emotional and practical benefits for parents through a feature card grid.

**Section title:**
> Why Families Love LOFT
> Built for children to love. Designed for parents to trust.

**Feature cards (icon or illustration per card):**

| Card Title | Description |
|---|---|
| Turn Screen Time Into Story Time | Children experience reading in a way that feels magical, interactive, and exciting — helping replace passive scrolling with meaningful learning. |
| Stories Children Relate To | Children engage with stories inspired by culture, familiar experiences, values, names, communities, and imagination that feel closer to home. |
| Build Confidence Through Reading | LOFT helps nurture confidence, vocabulary, curiosity, creativity, and stronger reading habits through joyful experiences. |
| Personalized Learning Experiences | From personalized birthday storybooks to tailored child profiles and age-based reading journeys, LOFT feels personal to every child. |
| Parent-Friendly Experience | Parents can support learning through easier guidance, child-focused experiences, and age-appropriate recommendations. |
| Reading Children Actually Enjoy | LOFT is built to make children want to read. |

> `[PLACEHOLDER — Card icons or supporting illustrations per feature]`

**CTA:** `Help Your Child Fall In Love With Reading` → External link to platform signup

---

### Section 4 — Stories That Feel Like Home

> **Purpose:** Differentiate LOFT through cultural identity and emotional connection.

**Section title:**
> Stories That Feel Like Home
> Because children deserve stories where they see themselves.

**Body copy:**
> At LOFT, we believe stories shape identity. That's why we create experiences inspired by our people, our places, our culture, our imagination, and the everyday magic children already recognize around them.
>
> We want children to see possibility in stories that feel familiar, joyful, aspirational, and deeply meaningful. Stories where names sound like theirs. Places feel recognizable. Values feel rooted. Dreams feel possible. Because when children see themselves reflected in stories, confidence grows.

**Visual:**
> `[PLACEHOLDER — Culturally inspired scene illustration or photography]`
> Concepts: Family settings, classrooms, joyful local environments, African-inspired adventure scenes, magical reinterpretations of everyday environments.

**CTA:** `Explore Our Reading World` → Scrolls to `#products`

---

### Section 5 — Products & Experiences
`#products`

> **Purpose:** Introduce the full LOFT product ecosystem. Cards only — no separate products page.

**Section title:**
> Discover The World Of LOFT
> Learning experiences designed to inspire confidence, imagination, and joyful reading.

**Product cards:**

| Product | Description | CTA | Link |
|---|---|---|---|
| Interactive Reading Platform | Magical reading experiences with engaging books children can explore anytime. | `Start Reading` | External → Platform |
| Personalized Birthday Books | Turn your child into the hero of a beautifully personalized birthday storybook. | `Create A Birthday Book` | External → Platform |
| Learning Printables & Activities | Fun educational activities designed around your child's growth. | `Explore Activities` | External → Platform |
| Learning Products | Educational tools, books, and experiences designed for curious minds. | `Shop Products` | External → Platform |
| Become A LOFT Ambassador | Help families discover LOFT while earning through meaningful impact. | `Become An Ambassador` | Scrolls to `#ambassador` |

> `[PLACEHOLDER — Product image or illustration per card]`

---

### Section 6 — How LOFT Works

> **Purpose:** Reduce friction and simplify the onboarding concept before asking for signup.

**Section title:**
> Getting Started Is Simple

**Steps:**
1. Create Your Account
2. Choose Your Experience — Reading plans, birthday books, learning activities, or ambassador journey
3. Personalize Your Journey — Set up child profiles and explore experiences tailored to your family
4. Start Reading & Growing — Build confidence, imagination, habits, and joyful learning

> `[PLACEHOLDER — Step illustration or icon per step]`

**CTA:** `Start Your Journey` → External link to platform signup

---

### Section 7 — Plans & Pricing
`#pricing`

> **Purpose:** Present subscription plans clearly and convert visitors. Data fetched dynamically from the platform API so pricing stays in sync.

**Implementation note:**
Plans and pricing are fetched via API from the platform at page load. The section renders the plan cards dynamically. A loading skeleton should display while data is fetching. If the API call fails, display a fallback CTA directing users to the platform to view pricing.

**Layout:**
- Plan cards in a clean grid
- Per-child subscription model reflected in copy
- Recommended plan highlighted
- CTA per plan: `Get Started` → External link to platform signup/checkout for that plan

**Fallback (API failure):**
> "View our current plans directly on the LOFT platform."
> CTA: `See Plans` → External link to platform pricing page

---

### Section 8 — Personalized Birthday Books

> **Purpose:** Position birthday books as a distinct, high-value product with its own moment on the page.

- What birthday books are and what makes them special
- The personalization angle: child's name, details, and story woven together
- CTA: `Order A Birthday Book` → External link to platform

> `[PLACEHOLDER — Birthday book product mockup image]`

---

### Section 9 — Testimonials / Social Proof

> **Purpose:** Build trust through real parent and ambassador voices.

- Three to five testimonial cards
- Mix of parent testimonials and ambassador stories
- Star rating, name, and short quote per card

> `[PLACEHOLDER — Real testimonials pending. Three placeholder cards with structure ready for swap-in.]`

---

### Section 10 — Ambassador Programme
`#ambassador`

> **Purpose:** Introduce and sell the ambassador opportunity.

**Content:**
- Full explanation of the ambassador opportunity
- How the programme works: referral → signup → commission
- Commission structure overview — `[PLACEHOLDER — Confirm tier structure]`
- Team Leader role explanation
- Benefits of joining
- Getting started steps
- Ambassador testimonial — `[PLACEHOLDER — Real quote pending]`

**CTA:** `Become An Ambassador` → External link to platform ambassador signup

---

### Section 11 — Portal Gateway: "Continue Your Journey"

> **Purpose:** Route returning users directly to their correct portal without needing to remember separate URLs. Eliminates the need for a separate login page on the marketing site.

**Section title:**
> Continue Your Journey

**Two gateway cards:**

| Card | Who It's For | Description | Button | URL |
|---|---|---|---|---|
| LOFT Platform | Parents, Customers, Ambassadors, Managers, Operations, Admins | Access your account and continue your LOFT journey | `Go To Portal` | `https://app.landoffairytales.com` |
| Children's Reading Portal | Children | Start reading, explore books, continue your adventure | `Start Reading` | `https://app.landoffairytales.com/child` |

> Design should feel warm and approachable — a friendly navigation aid, not a technical menu.
> The "Who It's For" column is for dev reference only and should not appear on the card itself. Card copy should remain simple and parent/child-friendly.

---

### Section 12 — Footer

- LOFT logo
- Anchor navigation links (mirrors top nav)
- Social media links — `[PLACEHOLDER — Confirm handles]`
- Legal: Privacy Policy, Terms of Use — `[PLACEHOLDER — Pages/links pending]`
- Contact or support link
- Copyright line

---

## 5. Content Dependencies

| Item | Source | Status |
|---|---|---|
| Homepage copy | Content Pack V1/V2 | Available |
| Ambassador copy | Content Pack V1/V2 | Available |
| Portal gateway copy | Content Pack V1/V2 | Available |
| Brand assets / visuals | Brand asset folder | Available |
| Plans & pricing data | Platform API | Integration required |
| Product images / illustrations | Asset folder | Partial — use placeholders |
| Testimonials | Client | Pending — use placeholder cards |
| Birthday book product mockup | Client | Pending — use placeholder |
| Social media handles | Client | Pending |
| Legal pages (Privacy Policy, Terms) | Client | Pending — link placeholder |
| Ambassador tier / commission structure | Client | Pending |
| Platform login URL | Confirmed | `https://app.landoffairytales.com` |
| Children's portal URL | Confirmed | `https://app.landoffairytales.com/child` |
| Signup URL | Dev | Confirm exact path before go-live |
| Checkout URLs (per plan) | Dev | Confirm exact paths before go-live |

---

## 6. Technical Requirements

| Requirement | Detail |
|---|---|
| Framework | Next.js |
| Structure | Single-page with anchor navigation and smooth scroll |
| Responsive | Mobile-first, fully responsive across mobile, tablet, desktop |
| Pricing data | Fetched from platform API at load, with loading skeleton and error fallback |
| SEO | Single-page meta title, description, and OG tags |
| Performance | Core Web Vitals conscious, optimised images via Next.js Image component |
| Accessibility | WCAG AA minimum |
| Analytics | GA4 event hooks on all CTA buttons, trackable by label |

---

## 7. Out of Scope

The following belong to the **Platform UX & Onboarding task** and should not be built here:

- Login and signup forms (owned by the platform)
- Post-login dashboards (Parent, Ambassador, Child)
- Role-based routing logic
- In-app onboarding flows
- In-app navigation and menus
- Empty states inside the platform
- Separate multi-page site structure

---

## 8. Acceptance Criteria

- All 12 sections present and navigable via anchor links
- Navigation smooth-scrolls to correct sections
- Portal gateway cards link correctly to each platform portal
- Plans & pricing section fetches from platform API with loading state and fallback
- All external platform links confirmed and functional before go-live
- All placeholder sections clearly labelled in code and visually
- Fully responsive across mobile, tablet, and desktop
- All CTA buttons carry trackable labels for analytics
- No broken anchor links
- Content Pack copy applied throughout all relevant sections
