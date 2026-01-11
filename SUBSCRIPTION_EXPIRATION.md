# Subscription Expiration System

## Overview
Implemented a comprehensive subscription expiration system with automatic status updates and email notifications.

## What Was Implemented

### 1. Cron API Endpoint
**File**: `src/app/api/cron/expire-subscriptions/route.ts`

- Automatically expires subscriptions past their `endDate`
- Updates subscription status from `ACTIVE` → `EXPIRED`
- Creates activity log entries
- Sends expiration email notifications
- Secured with `CRON_SECRET` authorization
- Supports both GET and POST methods

### 2. Runtime Validation
**Updated Files**:
- `src/app/actions/flipbooks.ts` - Flipbook access control
- `src/app/actions/plans.ts` - User subscription lookup
- `src/app/actions/user.ts` - Dashboard data fetching

All queries now validate: `status: "ACTIVE"` AND `endDate >= NOW()`

This ensures expired subscriptions are immediately blocked from accessing premium content, even before the cron runs.

### 3. Email Notification
**File**: `src/lib/email.ts`

Added `sendSubscriptionExpiredEmail()` function:
- Notifies users when their subscription expires
- Includes plan name and expiration date
- Provides renewal link
- Professional branded template

### 4. Environment Configuration
**File**: `.env.example`

Added `CRON_SECRET` for API security.

## Setup Instructions

### 1. Add Environment Variable
Add to your `.env` file:
```bash
CRON_SECRET="your-secure-random-string"
```

Generate a secure secret:
```bash
openssl rand -hex 32
```

### 2. Set Up Cron Job

#### Option A: Vercel Cron (Recommended)
1. Go to your Vercel project settings
2. Navigate to **Cron Jobs**
3. Add new cron job:
   - **Path**: `/api/cron/expire-subscriptions`
   - **Schedule**: `0 0 * * *` (daily at midnight UTC)
   - **Headers**: `Authorization: Bearer YOUR_CRON_SECRET`

#### Option B: External Cron Service
Use a service like [cron-job.org](https://cron-job.org):
1. Create new cron job
2. URL: `https://yourdomain.com/api/cron/expire-subscriptions`
3. Schedule: Daily at midnight
4. Headers:
   ```
   Authorization: Bearer YOUR_CRON_SECRET
   ```

#### Option C: Manual Trigger (Testing)
```bash
curl -X POST https://yourdomain.com/api/cron/expire-subscriptions \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## How It Works

### Flow Diagram
```
Daily at Midnight (Cron runs)
    ↓
1. Find subscriptions where:
   - status = "ACTIVE"
   - endDate < NOW()
    ↓
2. For each expired subscription:
   - Update status to "EXPIRED"
   - Create activity log
   - Send expiration email
    ↓
3. Return summary:
   - Count of expired subscriptions
   - Success/failure details
```

### Runtime Protection
Even without running the cron job, expired subscriptions are blocked:

```typescript
// Before accessing premium content
const subscription = await prisma.subscription.findFirst({
  where: {
    customerId: userId,
    status: "ACTIVE",
    endDate: { gte: new Date() } // ✅ Checks date in real-time
  }
});

if (!subscription) {
  // User has no active, non-expired subscription
  // → Block access to premium content
}
```

## Testing

### 1. Create Test Subscription
```typescript
// In Prisma Studio or seed script
await prisma.subscription.create({
  data: {
    customerId: "user-id",
    planId: "plan-id",
    status: "ACTIVE",
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-10'), // Past date
    autoRenew: false
  }
});
```

### 2. Manually Trigger Cron
```bash
curl -X POST http://localhost:3000/api/cron/expire-subscriptions \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 3. Expected Result
```json
{
  "success": true,
  "message": "Expired 1 subscriptions",
  "expired": 1,
  "failed": 0,
  "timestamp": "2026-01-11T00:00:00.000Z",
  "details": [
    {
      "status": "fulfilled",
      "value": {
        "subscriptionId": "sub-123",
        "userId": "user-456",
        "email": "user@example.com",
        "status": "success"
      }
    }
  ]
}
```

### 4. Verify Database
Check subscription status:
```sql
SELECT id, status, endDate 
FROM "Subscription" 
WHERE endDate < NOW();
```

Should show `status = "EXPIRED"`.

### 5. Check User Access
Try accessing premium flipbooks as the expired user:
- Should only see free flipbooks
- Premium flipbooks should be hidden
- Subscription banner should show "No active subscription"

## Monitoring

### Check Cron Logs
In Vercel:
1. Go to **Logs**
2. Filter by `/api/cron/expire-subscriptions`
3. Look for entries like:
   ```
   [CRON] Found 5 expired subscriptions
   [CRON] Expired subscription sub-123 for user user@example.com
   [CRON] Expiration complete: 5 succeeded, 0 failed
   ```

### Activity Logs
Check database for expiration activities:
```sql
SELECT * FROM "ActivityLog" 
WHERE "actionType" = 'SUBSCRIPTION_EXPIRED' 
ORDER BY "createdAt" DESC;
```

### Email Delivery
- Users receive "Your [Plan Name] Subscription Has Expired" email
- Email includes expiration date and renewal link
- Check email service logs for delivery confirmation

## Subscription Status Flow

```
User Subscribes
    ↓
Status: ACTIVE
endDate: startDate + plan.durationDays
    ↓
Time passes...
    ↓
endDate < NOW()
    ↓
Runtime Check: User blocked from premium content
    ↓
Cron Job Runs (midnight)
    ↓
Status: EXPIRED
Email sent
Activity logged
    ↓
User sees renewal prompt
```

## Important Notes

1. **Dual Protection**: Runtime checks + cron job ensure no expired user gets premium access
2. **Graceful Degradation**: Even if cron fails, runtime validation works
3. **Email Notifications**: Users are informed when their subscription expires
4. **Activity Logging**: All expirations are tracked in the activity log
5. **Security**: Cron endpoint requires CRON_SECRET authorization

## Database Schema

```prisma
model Subscription {
  status    String   // "ACTIVE" | "EXPIRED" | "CANCELLED"
  startDate DateTime
  endDate   DateTime // Checked against current date
  autoRenew Boolean  // Future feature
}
```

## Future Enhancements

- [ ] Auto-renewal for subscriptions with `autoRenew: true`
- [ ] Reminder emails 7 days before expiration
- [ ] Reminder emails 1 day before expiration
- [ ] Grace period (3 days after expiration)
- [ ] Subscription pause/resume functionality
- [ ] Pro-rated refunds for early cancellations
