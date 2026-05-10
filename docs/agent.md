# LOFT Platform — Dev Handoff Prompt (Antigravity)

## Context

LOFT is a Next.js reading platform for children. The platform has recently expanded from a single content library into three age-based ecosystems:

- **Little Lofters** — Ages 0–3
- **LOFT 365** — Ages 4–7
- **Big Readers** — Ages 8+

Age-based separation is implemented through book categories. We have five structural updates to implement. Priorities 1, 2, and 3 must be completed before Ambassador training next week. Please advise on whether Priority 4 is feasible before training or immediately after. Priority 5 follows after training.

Please review each item, advise on your recommended approach given the current codebase, and proceed in priority order.

---

## Role Hierarchy (Reference)

```
Admin
  └── Manager
        └── Supervisor (promoted Affiliate, leads a team)
              └── Affiliate → recruits Parents
        └── Affiliate (unassigned) → recruits Parents

Parent (formerly Customer)
  └── Child Profile A → own Subscription
  └── Child Profile B → own Subscription
  └── [Parent can also hold their own subscription without children]
```

---

## Subscription Tiers (Reference)

| Plan | Duration | Book Access |
|---|---|---|
| Free | 30 days | Free-tagged books only |
| Monthly Explorer | 30 days | Free + paid books |
| Semi-Annual | 180 days | Free + paid books |
| Yearly Enchanter | 365 days | Free + paid books |

---

## Priority 1 — Per-Child Subscription Model, Parent Role & Dashboard

### Problem
The "Customer" role has no concept of child profiles, per-child subscriptions, or reading progress tracking. One subscription currently grants blanket access to all children under an account.

### Changes Required

**Role Rename**
Rename "Customer" to "Parent" across the entire platform — admin dashboard, user-facing UI, database role labels, notifications, and all copy.

**Parent Dashboard**
- Parent can **add, edit, and remove** child profiles from their dashboard
- Each child profile displays: name, age group, assigned library, subscription tier, status, and reading progress (books opened, completed, last read)
- Parent purchases a **separate subscription per child** — each child profile is billed independently
- If a parent has **no children**, they can subscribe for themselves and access books directly — this must not break the existing flow

**Child Profile Fields**
- Name
- Date of birth or age group selection
- Assigned library (auto-mapped from age group)
- Subscription (tier, status, dates)
- Reading progress

**Child Profile Management Rules**
- Add: name + age group required
- Edit: name and age group editable by parent
- Remove: confirmation prompt required; advise on what happens to the active subscription on removal

**Admin Dashboard**
- "Customers" section renamed to "Parents"
- Each parent record shows: total number of children, list of child profiles, subscription status per child
- Admin has read-only visibility into child profiles

### Deliverables
- [ ] "Customer" renamed to "Parent" platform-wide
- [ ] Child profile schema (name, age group, subscription reference, reading progress)
- [ ] Parent dashboard: add, edit, remove child profiles
- [ ] Parent dashboard: per-child subscription status and reading progress display
- [ ] Per-child subscription purchase flow (each child billed separately)
- [ ] Parent self-subscription flow preserved (no children required)
- [ ] Server-side access check scoped per profile — validates subscription tier and free/paid eligibility
- [ ] Admin: Parents section with child count, child list, and per-child subscription visibility

---

## Priority 2 — Age-Based Library Access Control

### Problem
All subscribed users can currently access all content. Each child profile must only access books in their age-appropriate category group.

### Required Behavior
- Parent selects the child's age group during profile creation
- Platform maps selection to the correct category group:
  - 0–3 → Little Lofters
  - 4–7 → LOFT 365
  - 8+ → Big Readers
- Books outside the child's category group are inaccessible server-side
- Parents with multiple children manage each independently

### Open Question
Should age group be locked after selection or remain editable by the parent? Please advise on which is cleaner to implement and less prone to abuse.

### Deliverables
- [ ] Age group selection in child profile creation flow
- [ ] Server-side category group access logic scoped per child profile
- [ ] Books outside the child's category group blocked at API level
- [ ] Audit of existing books to confirm correct categorization across all 3 groups (provide migration script if corrections are needed)
- [ ] Parent dashboard: child name, age group, assigned library, subscription tier, status

---

## Priority 3 — Free/Paid Book Tagging & Access Enforcement

### Problem
Books have no Free/Paid flag. The platform cannot enforce the access split between Free-plan users (free books only) and paid-plan users (free + paid books) without it.

### Required Behavior
- Every book is tagged as **Free** or **Paid**
- Admin sets this flag at publish/edit time
- All existing books must be retroactively tagged
- Content API filters books based on the child's subscription tier:
  - Free tier → Free-tagged books only (within their age category)
  - Explorer / Semi-Annual / Yearly → Free + Paid books (within their age category)

### Deliverables
- [ ] Free/Paid flag added to book data model
- [ ] Free/Paid toggle on admin book publish and edit forms
- [ ] Retroactive tagging solution for existing books — advise on best approach (bulk admin UI, migration script, or both)
- [ ] Content API updated to filter by tier and access type

---

## Priority 4 — Supervisor Role

### Problem
There is no role between Manager and Affiliate. High-performing affiliates need a path to lead teams without losing their affiliate commission or status.

### Role Definition
- Supervisor is a **promoted Affiliate**
- They retain their affiliate role and continue recruiting customers — existing affiliate commission is completely unchanged
- They additionally earn **5% of the total earnings of all affiliates assigned to them** — this is additive, not a replacement
- Supervisors do **not** recruit other affiliates — only Managers recruit affiliates
- Every Supervisor and every Affiliate always belongs to a Manager

### Commission Logic

```
Supervisor earns:
  → Their own affiliate commission (no change)
  → + 5% of each assigned affiliate's earnings
```

### Admin Dashboard Changes
- Commission settings: add a **Supervisor Commission %** field (default: 5%, editable by admin)
- User management: visibility into Supervisor → Affiliate assignments

### Manager Dashboard Changes
- Promote an Affiliate to Supervisor
- Assign Affiliates to a Supervisor
- Unassign Affiliates from a Supervisor
- All three actions trigger automatic notifications to the relevant parties

### Supervisor Dashboard
- View list of assigned Affiliates with their performance and earnings
- View own commission breakdown: affiliate earnings + supervisor override earnings separately
- Cannot recruit or assign affiliates — Manager-only action

### Notifications (auto-triggered)
- Affiliate promoted to Supervisor → notify the Affiliate
- Affiliate assigned to a Supervisor → notify both the Affiliate and the Supervisor
- Affiliate unassigned from a Supervisor → notify both the Affiliate and the Supervisor

### Deliverables
- [ ] Supervisor role added to the role/permission system
- [ ] Supervisor commission field on admin commission settings (default 5%, editable)
- [ ] Supervisor earnings logic: affiliate commission + % of assigned affiliates' earnings
- [ ] Manager dashboard: promote affiliate to supervisor, assign/unassign affiliates
- [ ] Supervisor dashboard: assigned affiliates view + earnings breakdown
- [ ] Notification triggers: promotion, assignment, unassignment

**Please advise: is this achievable before Ambassador training, or does it follow immediately after?**

---

## Priority 5 — Regional Pricing, Currency Conversion & Payment Gateway Routing

### Problem
Prices are in GHS. International users need to see converted prices in their local currency and pay through a gateway that supports international cards. Paystack does not serve international users well.

### Required Behavior

**Geolocation & Pricing**
- Detect user's country via IP geolocation at session start
- Auto-convert GHS subscription prices to the user's local currency using a live exchange rate API
- GHS remains the base/canonical currency — conversion is for display and checkout only
- Converted prices shown at the pricing screen and throughout checkout

**Payment Gateway Routing**
- Ghana → **Paystack** (existing integration, no change)
- All other countries → **Stripe**
- If country detection fails → default to **Stripe**

**Implementation Notes**
- Fetch exchange rates at session start or checkout init — do not hardcode
- Cache rates (refresh every hour) to avoid excessive API calls
- Existing Ghana subscribers on Paystack must not be disrupted

### Open Questions
- Is Stripe already configured on the account, or does it need to be set up from scratch?
- Which exchange rate API do you recommend for our expected volume?
- Should users be able to manually override their detected country/currency?

### Deliverables
- [ ] IP-based geolocation at session start
- [ ] Live exchange rate integration (GHS → local currency)
- [ ] Gateway routing: Ghana → Paystack, all others → Stripe, detection failure → Stripe
- [ ] Currency-matched pricing display and checkout
- [ ] Stripe integration and configuration for international users

---

## Combined Access Control Logic

When any profile (child or self-subscribing parent) attempts to open a book:

```
1. Does this profile have an active subscription?                 → if no, block
2. Does the book's category group match the profile's age group?  → if no, block (child only)
3. If the book is Paid, does the profile's tier allow paid access? → if no, block
→ All checks pass = ACCESS GRANTED
```

---

## Timeline

**Before Ambassador training:**
- P1: Parent role, child profile management, per-child subscriptions, parent dashboard
- P2: Age group selection + category group access routing
- P3: Free/Paid book tagging + access enforcement

**Confirm feasibility before training:**
- P4: Supervisor role

**Immediately after training:**
- P4: Supervisor role (if not completed pre-training)
- P5: Geolocation + currency conversion + gateway routing

---

## What We Need From You

1. Confirm what is achievable before training and flag anything that needs more time
2. Propose temporary stopgaps for items that cannot be completed in time
3. Share your recommended approach per priority before starting — especially P1 schema changes, P3 retroactive tagging, and P5 gateway/exchange rate setup
4. Advise on whether age group should be locked or editable post-creation (P2)
5. Advise on what happens to a child's active subscription when a parent removes the child profile (P1)
6. Confirm whether Stripe is already set up or needs to be created (P5)
7. Confirm estimated effort per priority
8. Flag any risks or dependencies upfront

Please come back with your plan before starting any build work.