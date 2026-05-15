# LOFT Platform — Ambassador Leaderboard, Roles & Performance System
### Prompt for Gemini CLI Implementation

---

## Current System State

The platform currently has the following roles:
- **Admin** — platform owner/superuser
- **Manager** — recruits and manages Affiliates
- **Affiliate** — recruits Customers/Parents
- **Customer / Parent** — end users (same role, recently renamed)

The following is already built:
- Managers have an invite/referral QR code used to recruit Affiliates
- Affiliates have an invite/referral QR code used to recruit Customers/Parents
- Admin has an input field in commission settings to set Manager commission rate (what Managers earn from Affiliate sales)
- A sign-up bonus system exists where Affiliates earn GHS 5 when they sign up a free-plan user

---

## What Is Changing — Summary

1. A new **Operations Manager** role is being introduced above Managers
2. A new **Team Leader** role is being introduced — this does not exist in the current codebase and needs to be built from scratch
3. Managers now recruit **both Affiliates and Customers/Parents** (previously Affiliates only)
4. Managers now earn commissions on **both Affiliate-driven sales and direct Customer sales** (previously Affiliate sales only)
5. The **GHS 5 sign-up bonus for free-plan signups is removed entirely**
6. The **commission settings on the admin dashboard** need new fields
7. The **earnings calculator** needs to be updated to reflect the full commission structure
8. A full **leaderboard, performance tracking, and analytics system** is being introduced

Please implement all changes in the order defined below. Advise on any schema or architectural decisions before building.

---

## Part 1 — Role & Hierarchy Changes

### 1.1 New Role: Operations Manager

Introduce a new **Operations Manager** role. There is only ever **one** Operations Manager on the platform.

**Position in hierarchy:**
```
Admin
  └── Operations Manager (single user)
        └── Manager
              └── Team Leader (promoted Affiliate, leads a team)
                    └── Affiliate → recruits Customers/Parents
              └── Affiliate (unassigned) → recruits Customers/Parents
```

**Operations Manager permissions:**
- View everything on the platform — all dashboards, all analytics, all users
- View all ambassador, team leader, and manager earnings
- Recruit Affiliates directly (has their own invite/referral code)
- Promote Affiliates to Team Leaders
- Promote Team Leaders to Managers
- Assign and reassign Affiliates to Team Leaders or Managers
- Remove assignments
- Manage leaderboard visibility settings
- Search, filter, and sort all users
- Access full user profiles across the entire hierarchy

**Operations Manager earnings:**
- 5% override commission on ALL earnings generated across the entire ambassador system
- This is calculated automatically — not tied to personal sales

**Admin notes:**
- The Operations Manager is NOT the Admin — Admin is the platform superuser
- The Operations Manager is an operational role within the ambassador structure
- Only the Admin can create or assign the Operations Manager role

---

### 1.2 New Role: Team Leader

Team Leader is a **brand new role** — it does not exist in the current codebase and needs to be built from scratch.

**Team Leader permissions:**
- Continue selling and earning as a normal Affiliate — nothing changes about their base role
- View assigned team members and their performance stats (sales counts, rankings)
- View team analytics and leaderboard rankings
- Cannot see other ambassadors' or team leaders' revenue — only their own
- Cannot recruit Affiliates
- Cannot create invite codes
- Cannot promote or assign users — this is Manager and Operations Manager only

**Team Leader earnings:**
- 20% commission on personal sales (same as any Affiliate)
- PLUS 2% override commission on all earnings from their assigned team

---

### 1.3 Updated Manager Role

**What changes:**
- Managers can now recruit **both Affiliates and Customers/Parents directly** (previously Affiliates only)
- Managers earn commissions on **direct Customer/Parent sales** in addition to Affiliate-driven sales
- Managers can now promote Affiliates to Team Leaders (previously Operations Manager only — now both can)

**Manager earnings (updated):**
- **20% commission on paid subscriptions** from Customers/Parents they directly recruited (any paid plan — Free plan generates zero)
- **3% override commission** on all sales made by Affiliates they recruited — this is not on the affiliate themselves joining, but on every transaction the affiliate completes
- **3% override commission** on all sales across everyone under them — Team Leaders and their assigned Affiliates
- **Same fixed product commission value as Affiliates** on product sales — the existing per-product commission value set in admin applies to Managers equally (no separate field needed)

**Manager permissions (updated):**
- Recruit Affiliates (existing)
- Recruit Customers/Parents directly (new)
- Have their own invite/referral code usable for both Affiliates and Customers
- Promote Affiliates to Team Leaders
- Assign/unassign Affiliates to Team Leaders
- View full performance stats and earnings for everyone in their hierarchy
- Cannot access Operations Manager settings or data outside their hierarchy

---

### 1.4 Affiliate Role (No Change to Role, Earnings Clarified)

- 20% commission on personal sales (paid subscriptions only — see Part 2)
- Recruits Customers/Parents via their referral link/QR code
- Cannot recruit or manage other Affiliates

---

## Part 2 — Commission & Earnings Changes

### 2.1 Remove Sign-Up Bonus

**Remove the GHS 5 sign-up bonus system entirely.**

- Affiliates currently earn GHS 5 when they sign up a free-plan user
- This should be removed — no bonuses are awarded for free-plan signups or any other signup event
- Commissions and overrides are only triggered by **completed paid subscription purchases**
- Free plan signups generate zero commission for anyone
- Remove this logic from the earnings calculator, the database trigger (if any), and any UI that displays or references it

---

### 2.2 Global Commission Rate — Paid Plan Referrals

Add a **global commission rate field** in Admin > Settings > Commissions for:

> **"Commission rate on paid plan subscriptions referred by Affiliates, Team Leaders, and Managers"**

This is the percentage that an Affiliate, Team Leader, or Manager earns when a Customer/Parent they directly referred purchases a paid subscription plan (Monthly Explorer, Semi-Annual, or Yearly Enchanter).

- This rate applies to **direct referrals only** — i.e. the person whose referral link/code the customer used at signup
- It is set by Admin and applies uniformly across all paid plans
- The 20% figure currently used should be the default, but it must be configurable — not hardcoded
- **Managers recruiting Affiliates do not earn this rate on the affiliate joining** — they earn 3% on the affiliate's subsequent sales transactions instead

---

### 2.3 Admin Commission Settings — New Fields

The existing Admin > Settings > Commissions section currently has:
- Manager commission rate field (what Managers earn from Affiliate sales)

**Add the following new fields:**

| Field Label | Description | Default |
|---|---|---|
| Operations Manager Override Rate | % of total system earnings the Operations Manager receives | 5% |
| Manager Override Rate | % override Managers earn on all sales transactions made by Affiliates and Team Leaders under them | 3% |
| Team Leader Override Rate | % override Team Leaders earn on their assigned team | 2% |
| Global Paid Plan Referral Rate | % commission earned by any referrer on a paid subscription purchase | 20% |

**Notes:**
- The existing Manager commission field should be reviewed — confirm whether it maps to the new "Manager Override Rate" or the "Global Paid Plan Referral Rate" and consolidate accordingly to avoid duplication
- All fields must be editable by Admin only
- Changes to these rates should apply to future earnings calculations only — do not retroactively recalculate historical payouts

---

### 2.4 Earnings Calculator Update

Update the earnings calculator to reflect the full commission structure:

```
Affiliate earns:
  → Global Paid Plan Referral Rate % on paid subscriptions from Customers/Parents they referred
  → Fixed product commission value (set per product in admin) on product sales

Team Leader earns:
  → Global Paid Plan Referral Rate % on paid subscriptions from Customers/Parents they referred
  → + Team Leader Override Rate % on their assigned team's total earnings
  → Fixed product commission value on product sales

Manager earns:
  → Global Paid Plan Referral Rate % (20%) on paid subscriptions from Customers/Parents they directly recruited
  → + 3% override on all sales transactions made by Affiliates they recruited
  → + 3% override on all sales across Team Leaders and Affiliates under them
  → Fixed product commission value (same as Affiliate rate) on product sales they are attributed to
  → Recruiting an Affiliate generates ZERO commission — only the affiliate's subsequent sales trigger the 3%

Operations Manager earns:
  → Operations Manager Override Rate % on total earnings across the entire system
```

**Rules:**
- Free plan signups = zero commission for everyone
- Only completed, paid subscription purchases trigger any commission
- Override commissions cascade correctly through the hierarchy
- Earnings are attributed to the referrer whose invite link/code was used at signup

---

## Part 3 — Leaderboard & Performance System

### 3.1 Main Leaderboard Dashboard

A new leaderboard dashboard accessible to all ambassador roles (visibility rules apply per role — see Part 4).

**Columns/fields shown:**
- Ranking position
- Name
- Profile photo / avatar
- Role (Affiliate / Team Leader / Manager / Operations Manager)
- Ambassador ID
- Number of sales (paid subscriptions)
- Activity status (Active / Inactive)
- Join date
- Assigned Team Leader / Manager (where applicable)

**Revenue/earnings columns:** visible only to roles with permission (see Part 4)

**Default sort:** by number of sales, descending

---

### 3.2 Search, Sort & Filter

**Search by:**
Name, role, Ambassador ID, email, team leader, manager, sales count, activity status

**Sort by:**
Sales count, revenue (role-permissioned), ranking, alphabetical, join date, activity, team, role

**Filter by:**
Role type, active/inactive, team leaders, managers, top performers, date range, assigned/unassigned, monthly performance

Search should be fast and dynamic — no full page reload.

---

### 3.3 Detailed User Profile View

Clicking any user from the leaderboard opens a detailed profile page.

**Basic information:**
- Full name, contact details, role, Ambassador ID, join date, status

**Performance metrics (role-permissioned):**
- Total sales, total subscriptions sold
- Revenue generated (where permitted)
- Commission earned (personal)
- Override earnings (where applicable)
- Monthly performance breakdown
- Historical performance chart

**Team information:**
- Assigned Manager
- Assigned Team Leader
- Team members (if Team Leader or Manager)
- Downline structure

**Activity:**
- Recent sales activity
- Performance timeline
- Growth trends

---

### 3.4 Analytics & Reporting

- Monthly performance tracking per user and per team
- Revenue analytics (role-gated)
- Team analytics for Managers and Operations Manager
- Earnings breakdowns (personal vs override)
- Historical performance charts
- Growth trends

---

## Part 4 — Role-Based Visibility Rules

| Data | Operations Manager | Manager | Team Leader | Affiliate |
|---|---|---|---|---|
| Own earnings | ✅ | ✅ | ✅ | ✅ |
| Own sales stats | ✅ | ✅ | ✅ | ✅ |
| Team members' sales counts | ✅ | ✅ | ✅ (own team only) | ❌ |
| Team members' revenue | ✅ | ✅ (own hierarchy) | ❌ | ❌ |
| All ambassador earnings | ✅ | ❌ | ❌ | ❌ |
| Leaderboard rankings | ✅ | ✅ | ✅ | ✅ |
| Full user profiles | ✅ | ✅ (own hierarchy) | ❌ | ❌ |
| Hierarchy outside own team | ✅ | ❌ | ❌ | ❌ |

---

## Part 5 — Notifications

Send notifications for:
- Affiliate promoted to Team Leader
- Team Leader promoted to Manager
- Affiliate assigned to a Team Leader
- Affiliate unassigned from a Team Leader
- Leaderboard ranking milestones
- Monthly performance summaries (future)

All promotion and assignment actions notify the relevant parties immediately.

---

## Part 6 — UI/UX Requirements

- Modern, clean, mobile-friendly
- Fast — search and leaderboard updates should not require full page reloads
- Role-appropriate dashboards — each role sees only what they are permitted to see
- Motivating and competitive feel for the leaderboard
- Earnings breakdown clearly shows personal vs override earnings as separate line items

---

## Deliverables

**Role & hierarchy:**
- [ ] Operations Manager role with full permissions and earnings logic
- [ ] Team Leader role built from scratch with correct permissions, earnings logic, and dashboard visibility
- [ ] Manager updated to recruit Customers/Parents and earn on direct sales
- [ ] Hierarchy structure enforced correctly in the database

**Commission & earnings:**
- [ ] Sign-up bonus (GHS 5 free plan) removed entirely
- [ ] Admin commission settings: Operations Manager, Manager Override, Team Leader Override, and Global Paid Plan Referral Rate fields added
- [ ] Existing Manager commission field consolidated or clarified (advise before touching)
- [ ] Earnings calculator updated to reflect full commission structure
- [ ] Free plan signups confirmed to generate zero commission

**Leaderboard & performance:**
- [ ] Main leaderboard dashboard with search, sort, and filter
- [ ] Detailed user profile view
- [ ] Role-based visibility enforced across all data views
- [ ] Analytics and earnings breakdown views per role
- [ ] Notification triggers for promotions and assignments

---

## Questions to Resolve Before Building

1. Does the existing Manager commission field in admin settings map to the new Manager Override Rate or the Global Paid Plan Referral Rate? Confirm before adding new fields to avoid duplication.
2. Is the sign-up bonus currently triggered by a database event, a background job, or inline in the signup flow? Confirm the removal point.
3. Should the Operations Manager role be creatable only by Admin from the admin dashboard, or is there a separate onboarding flow?
4. For the leaderboard, should rankings reset monthly or be cumulative all-time? (The brief lists monthly resets as a future feature — confirm default behaviour for launch.)
5. What charting library is currently in use for any existing analytics views?

Please advise on all five before starting the build.