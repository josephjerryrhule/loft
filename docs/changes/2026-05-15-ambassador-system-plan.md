# Ambassador Leaderboard, Roles & Performance System Plan

## Questions Resolved

1. **Manager commission field in admin settings:** The existing field `managerCommissionPercentage` (default 20%) currently applies to Affiliate sales. Under the new rules, this will be repurposed as the **Manager Override Rate** (default 3%). A new **Global Paid Plan Referral Rate** (default 20%) will be added for direct sales.
2. **Sign-up bonus trigger:** The sign-up bonus is triggered inline during the signup flow via `processSignupCommission` in `src/app/actions/auth.ts`. We will remove this function and all related database/UI references entirely.
3. **Operations Manager creation:** Since there is only one Operations Manager, this role will be creatable only by the Admin from the Admin dashboard.
4. **Leaderboard default ranking behavior:** Rankings will be cumulative (all-time) by default for launch. Monthly filtering can be added later.
5. **Charting library:** The project currently uses `recharts` (^3.6.0), which we will use for the new analytics views.

---

## Implementation Plan

### Phase 1: Database Schema & Role Setup
1. **Schema Updates:** 
   - Add `TEAM_LEADER` and `OPERATIONS_MANAGER` to the implicit role strings.
   - Add `teamLeaderId` to the `User` model to link Affiliates to Team Leaders, alongside the existing `managerId`.
2. **Settings Updates:** 
   - Rename existing `managerCommissionPercentage` to `managerOverrideRate` (default 3%).
   - Add `operationsManagerOverrideRate` (5%), `teamLeaderOverrideRate` (2%), and `globalPaidPlanReferralRate` (20%) to `SystemSettings`.
3. **Role Permissions:** 
   - Ensure the `ADMIN` can assign the `OPERATIONS_MANAGER` role.
   - Update existing Admin/Manager logic to allow `OPERATIONS_MANAGER` access to system-wide data.

### Phase 2: Commission System Overhaul
1. **Remove Sign-Up Bonus:** 
   - Delete `processSignupCommission` from `src/lib/commission.ts`.
   - Remove the call to this function in `src/app/actions/auth.ts`.
   - Clean up `signupBonus` from admin settings UI and backfill scripts.
2. **Update Commission Logic (`src/lib/commission.ts`):** 
   - **Direct Referrals:** Pay the referrer (Affiliate, Team Leader, or Manager) the `globalPaidPlanReferralRate` on paid subscriptions.
   - **Overrides:** 
     - If the referrer has a Team Leader, pay the Team Leader the `teamLeaderOverrideRate`.
     - If the referrer has a Manager (or the Team Leader has a Manager), pay the Manager the `managerOverrideRate` (3%). If the Manager directly recruited the Affiliate, they get the 3% override.
     - Pay the Operations Manager the `operationsManagerOverrideRate` (5%) on every transaction.
   - **Products:** Maintain the fixed product commission value for direct sales, but apply overrides on top.
   - **Free Plans:** Ensure no commissions are generated for free plan signups.

### Phase 3: Leaderboard & Dashboard Construction
1. **Leaderboard API (`src/app/actions/leaderboard.ts`):** 
   - Create actions to fetch ambassadors, calculate their sales counts, and determine revenue.
   - Implement role-based visibility filters directly in the SQL/Prisma queries so users only see what they are allowed to.
2. **Leaderboard UI:** 
   - Build `/leaderboard` route accessible to all ambassador roles.
   - Include a fast search, sort, and filter sidebar/header.
   - Render the data table showing Rank, Name, Role, Sales, etc.
3. **Detailed User Profile:** 
   - Clicking a user opens a modal or new page (`/leaderboard/[id]`) showing detailed stats.
   - Use `recharts` for historical performance.
   - Hide revenue figures if the viewing user lacks permission.

### Phase 4: Team Management & Notifications
1. **Assignment UI:** 
   - Add forms in the Operations Manager and Manager dashboards to promote Affiliates to Team Leaders.
   - Add capability to assign/unassign Affiliates to Team Leaders.
2. **Recruitment Links:** 
   - Update Manager invite links to support recruiting both Affiliates and Customers.
3. **Notifications:** 
   - Implement simple in-app notifications or emails (using existing email logic) when a user is assigned, promoted, or hits a milestone.

---
*Please review this plan. Once approved, I will spin up agents to execute these phases sequentially.*