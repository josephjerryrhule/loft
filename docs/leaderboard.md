# LOFT Platform — Ambassador Verification System Prompt (Antigravity)

## Context

The LOFT platform already has QR codes in use for Managers and Affiliates — Managers use their QR code to invite Affiliates, and Affiliates use theirs to invite customers. We are not replacing or rebuilding any of that.

What we need is a single new addition to the existing platform: a **live ambassador verification page** that any member of the public can reach by scanning an ambassador's QR code, so they can instantly confirm whether that person is a legitimate, currently active LOFT Ambassador.

This is not a new platform. It is one new public-facing route built into the existing Next.js application.

---

## What Needs to Be Built

### 1. Ambassador Verification Page

**Route:**
```
/verify/[ambassadorId]
```

Example:
```
/verify/LFT-AMB-024
```

This page is **fully public** — no login required. Anyone who scans an ambassador's QR code lands here.

**What the page must display:**

| Field | Description |
|---|---|
| Ambassador Photo | Profile photo uploaded by admin |
| Full Name | Ambassador's registered name |
| Ambassador ID | e.g. LFT-AMB-024 |
| Role | Affiliate / Supervisor / Manager |
| Status | ACTIVE or INACTIVE (see states below) |
| Expiry Date | When the ambassador's current term expires |
| Verification Timestamp | Live — the exact date and time the page was loaded |
| Official LOFT confirmation | Branded confirmation footer |

**Active State — display:**
```
✅ VERIFIED ACTIVE LOFT AMBASSADOR
This person is an officially authorized representative of LOFT.
```

**Inactive / Deactivated State — display:**
```
❌ THIS PERSON IS NO LONGER AUTHORIZED BY LOFT
This ambassador has been deactivated. They are not authorized to
represent or recruit on behalf of LOFT.
```

- The inactive state must be immediate — the moment an admin deactivates an ambassador in the backend, the next scan of their QR code shows the inactive state
- There should be no cached or static version of the active state that can be screenshot-exploited — the status is always pulled live from the database on page load
- The page must be served exclusively through the platform — no third-party hosting, no redirects to external pages

---

### 2. QR Code Update (Existing Ambassadors)

The existing QR codes for Affiliates and Managers currently point to the invite/referral flow. We need to evaluate two options — please advise on the cleanest approach:

**Option A:** Update the existing QR code to point to the verification page (`/verify/[ambassadorId]`) and handle the invite flow via a separate link instead

**Option B:** Generate a second QR code per ambassador specifically for verification, keeping the existing invite QR code untouched

The invite flow must not break regardless of which approach is chosen.

---

### 3. Ambassador ID Generation

Every ambassador must have a unique ID in the format:
```
LFT-AMB-[number]
```
Example: `LFT-AMB-001`, `LFT-AMB-024`, `LFT-AMB-103`

- IDs should be auto-generated when a new ambassador is approved
- IDs are permanent — they do not change if the ambassador is deactivated or reactivated
- Check whether existing ambassadors in the system already have a unique identifier that can be formatted into this scheme, or if new IDs need to be generated and backfilled

---

### 4. Admin Controls (within existing admin dashboard)

Add the following to the existing ambassador management section of the admin dashboard — no new dashboard needed:

- **Activate / Deactivate toggle** — instantly updates status reflected on the verification page
- **Expiry date field** — admin can set and renew the ambassador's active term
- **View verification page** — a direct link from the admin record to preview the ambassador's live verification page
- **Ambassador ID display** — shown on each ambassador's admin record

---

### 5. Profile Photo — Ambassador & Manager Settings

Profile photos used on the verification page should be uploaded by the ambassador or manager themselves — not by admin. Add a **Profile Photo** field to the Settings page of both the Ambassador (Affiliate/Supervisor) and Manager dashboards.

**Behaviour:**
- Ambassador/Manager uploads or replaces their profile photo from their own Settings page
- Photo is immediately reflected on their live verification page once uploaded
- If no photo has been uploaded yet, show a default avatar placeholder on the verification page
- Admin can see whether a photo has been set on the ambassador's record but cannot upload on their behalf
- Enforce a minimum image size and square crop on upload to keep verification page photos consistent

---

### 5. Security Requirements

- The verification page must be served over HTTPS (SSL) — enforce this
- Status must always be fetched live from the database — no static rendering or aggressive caching of the status field
- Add a **"Report suspicious ambassador"** option at the bottom of the verification page — a simple form or mailto link that sends a flag to an internal LOFT admin email
- Advise on whether a rotating security token on the QR code is feasible within the current setup as a future upgrade (not required for this phase)

---

## What We Are NOT Building

- No new platform or standalone app
- No separate ambassador login portal (future phase)
- No commission or performance tracking on this page (already handled in the Finance dashboard)
- No Google Sites, Canva, Notion, or any third-party hosted verification pages — everything runs through the platform only

---

## Deliverables

- [ ] `/verify/[ambassadorId]` public route — active and inactive states
- [ ] Live status fetch from database on every page load (no cached status)
- [ ] Auto-generation of `LFT-AMB-[number]` IDs for new ambassadors + backfill plan for existing ones
- [ ] Admin controls: activate/deactivate, expiry date, verification page preview link
- [ ] Profile photo upload added to Ambassador and Manager Settings pages
- [ ] Default avatar placeholder shown on verification page if no photo uploaded
- [ ] QR code strategy confirmed — Option A or B — with invite flow preserved
- [ ] HTTPS enforced on verification route
- [ ] "Report suspicious ambassador" option on verification page
- [ ] Branded verification page design consistent with LOFT platform styling

---

## Questions for Your Recommendation

1. Do existing ambassadors have a unique identifier in the current database that can be mapped to the `LFT-AMB-[number]` format, or do IDs need to be generated and backfilled from scratch?
2. For the QR code — Option A (update existing QR to verify page, move invite to a link) or Option B (second QR code per ambassador for verification only) — which do you recommend given the current implementation?
3. Is the verification page status field safe from aggressive caching at the CDN or server level, or do we need to explicitly set cache-control headers to force a live fetch every time?

Please advise on the above before starting the build.