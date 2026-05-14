# Implementation Plan: LOFT Ambassador Verification System

This document outlines the plan for implementing the Ambassador Verification System as requested in `docs/leaderboard.md`.

## 1. Database Schema Updates

Update `prisma/schema.prisma` to include ambassador-specific fields.

```prisma
model User {
  // ... existing fields
  ambassadorId      String?    @unique @map("ambassador_id")
  ambassadorExpiry  DateTime?  @map("ambassador_expiry")
  // We will use the existing 'status' field:
  // ACTIVE -> VERIFIED ACTIVE LOFT AMBASSADOR
  // SUSPENDED/PENDING -> NO LONGER AUTHORIZED
}
```

## 2. Ambassador ID Generation & Backfill

### Strategy
- IDs will follow the format `LFT-AMB-[number]` (e.g., `LFT-AMB-001`).
- We will implement a utility function to generate the next ID based on the count of existing IDs.
- A backfill script will be created to assign IDs to all existing users with roles `MANAGER` or `AFFILIATE`.

## 3. QR Code Strategy (Option A Recommendation)

**Recommendation:** Update the existing QR code to point to the verification page.

### Why Option A?
- It provides a single point of truth for the ambassador's identity.
- It builds trust with potential recruits/customers by showing verification first.
- The verification page will include clear "Call to Action" buttons (e.g., "Join as Affiliate", "Sign up as Customer") which will link to the original referral/invite URLs.

### Implementation
- Update `src/app/api/generate-qr/route.ts` to use `${baseUrl}/verify/${user.ambassadorId}` as the target URL for Managers and Affiliates.
- Ensure the verification page is public and mobile-friendly.

## 4. Public Verification Page (`/verify/[ambassadorId]`)

- **Route:** `src/app/verify/[ambassadorId]/page.tsx`
- **Features:**
    - Live fetch from database (no caching).
    - Display: Photo, Name, ID, Role, Status, Expiry.
    - Dynamic timestamp.
    - "Report suspicious ambassador" mailto link.
    - "Join LOFT" CTA buttons leading to referral links.

## 5. Admin Controls

- Update User management UI in Admin Dashboard:
    - Add fields for `ambassadorId` and `ambassadorExpiry`.
    - Add a toggle for Status (Active/Inactive).
    - Add a "View Verification Page" link.
- Update `updateUser` action to handle these new fields.

## 6. Profile Photo Upload

- Ensure `MANAGER` and `AFFILIATE` roles have access to profile photo upload in their Settings page.
- Current implementation in `src/app/actions/user.ts` and `src/components/user/SettingsForm.tsx` (or similar) will be reviewed and updated if necessary to support square cropping and minimum size as requested.

## 7. Security & Compliance

- Enforce HTTPS.
- Set `Cache-Control: no-store, max-age=0, must-revalidate` on the verification page.
- Implement rate limiting on the verification route to prevent scraping.

---

## Questions & Confirmations

1. **Database ID mapping:** Existing users do not have a sequential `LFT-AMB` ID. I will generate these starting from `001` based on their `createdAt` order during the backfill.
2. **QR Code:** I will proceed with **Option A** unless otherwise directed.
3. **Caching:** I will use Next.js dynamic rendering and explicit headers to prevent caching.

---

## Deliverables

1. Prisma migration for new fields.
2. Backfill script for existing ambassadors.
3. `/verify/[ambassadorId]` public page.
4. Updated QR code generation API.
5. Updated Admin Dashboard user editing.
6. Updated Settings page for profile photo.
