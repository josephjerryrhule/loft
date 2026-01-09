# System Settings & Security Updates

## ✅ Completed Updates

### 1. Fixed Syntax Error in Plans Page
**File:** [src/app/(dashboard)/customer/plans/page.tsx](src/app/(dashboard)/customer/plans/page.tsx)

**Issue:** JSX syntax error preventing compilation
```tsx
// Before (❌ Error)
) : (
    {session?.user?.email && (

// After (✅ Fixed)
) : (
    session?.user?.email && (
```

**Status:** ✅ Fixed - Plans page now compiles successfully

---

### 2. Live/Test Toggle for Paystack Keys
**File:** [src/components/admin/SystemSettingsForm.tsx](src/components/admin/SystemSettingsForm.tsx)

**Changes:**
- Added environment mode toggle (Test/Live)
- Separate input fields for test and live API keys
- Visual distinction between test (normal) and live (warning color) keys
- Hidden input to store selected mode

**Fields Added:**
- `paystackMode` - Toggle between "test" or "live"
- `paystackTestPublicKey` - Test public key (pk_test_...)
- `paystackTestSecretKey` - Test secret key (sk_test_...)
- `paystackLivePublicKey` - Live public key (pk_live_...)
- `paystackLiveSecretKey` - Live secret key (sk_live_...)

**UI Features:**
- Toggle buttons to switch between test and live mode
- Only shows relevant fields based on selected mode
- Warning indicator for live mode (red border)
- Help text explaining current mode

**Updated Files:**
- [src/lib/paystack.ts](src/lib/paystack.ts) - Updated to fetch correct keys based on mode
- [src/app/actions/payment.ts](src/app/actions/payment.ts) - Updated to use new getPaystackSecretKey function

---

### 3. Password Visibility Toggle
**New File:** [src/components/ui/password-input.tsx](src/components/ui/password-input.tsx)

**Features:**
- Reusable password input component
- Eye icon button to toggle visibility
- Shows/hides password text on click
- Maintains all standard input props
- Accessible with screen reader support

**Implementation:**
```tsx
<PasswordInput 
  placeholder="Enter password" 
  defaultValue={settings.apiKey}
/>
```

**Updated Files:**
- [src/app/auth/login/page.tsx](src/app/auth/login/page.tsx) - Password field now has visibility toggle
- [src/app/auth/register/page.tsx](src/app/auth/register/page.tsx) - Password field now has visibility toggle
- [src/components/admin/SystemSettingsForm.tsx](src/components/admin/SystemSettingsForm.tsx) - All password fields now have visibility toggle:
  - SMTP Password
  - Paystack Test Secret Key
  - Paystack Live Secret Key

---

### 4. Webhook URL Display
**File:** [src/components/admin/SystemSettingsForm.tsx](src/components/admin/SystemSettingsForm.tsx)

**Features:**
- Displays webhook URL on Payment Gateway tab
- Read-only input showing: `https://yourdomain.com/api/webhooks/paystack`
- Copy button to copy URL to clipboard
- Success toast when copied
- Help text with instructions

**UI Elements:**
- Webhook URL input (read-only, monospace font)
- Copy button with icon
- Icon changes to checkmark after copying
- Instructions: "Add this URL to your Paystack dashboard under Settings → Webhooks"

---

## 📋 Technical Details

### Paystack Mode Selection Logic

**In `lib/paystack.ts`:**
```typescript
export async function getPaystackPublicKey(): Promise<string> {
  const settings = await getSystemSettings();
  const mode = settings.paystackMode || "test";
  
  if (mode === "live") {
    return settings.paystackLivePublicKey || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
  }
  
  return settings.paystackTestPublicKey || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
}
```

- Checks `paystackMode` setting (defaults to "test")
- Returns appropriate keys based on mode
- Falls back to environment variables if not set in settings

### Password Input Component

**Features:**
- Client component with React state
- Toggle button positioned absolutely within input
- Eye/EyeOff icons from lucide-react
- Switches input type between "password" and "text"
- Full TypeScript support with proper refs

### Webhook URL Generation

**Client-side detection:**
```typescript
const webhookUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/api/webhooks/paystack`
    : "";
```

- Generates URL dynamically based on current domain
- Works in any environment (dev, staging, production)
- No hardcoded URLs needed

---

## 🎨 UI/UX Improvements

### Mode Toggle
- Clear visual distinction between test and live modes
- Test mode: Standard styling with blue accent
- Live mode: Red/warning colors to indicate caution
- Only shows relevant fields for selected mode
- Smooth transitions between modes

### Password Visibility
- Intuitive eye icon that users recognize
- Icon changes based on visibility state
- Doesn't interfere with input functionality
- Accessible with keyboard navigation
- Works consistently across all forms

### Webhook URL Display
- Professional monospace font for technical URLs
- One-click copy functionality
- Visual feedback (icon change + toast)
- Clear instructions for where to use the URL
- Eliminates manual URL typing errors

---

## 🔒 Security Considerations

### Separate Test/Live Keys
- Prevents accidental use of live keys in development
- Visual warnings when live mode is active
- Keys stored separately in database
- Mode selection prevents mixing test and live credentials

### Password Visibility Toggle
- Users can verify they typed password correctly
- Reduces login errors due to typos
- Optional - user chooses when to reveal
- Still defaults to hidden for security
- No password stored in component state

---

## 📝 Configuration Guide

### Setting Up Paystack Keys

1. **Get API Keys from Paystack:**
   - Login to [Paystack Dashboard](https://dashboard.paystack.com)
   - Go to Settings → API Keys & Webhooks
   - Copy both public and secret keys
   - Note: Test keys start with `pk_test_` and `sk_test_`
   - Live keys start with `pk_live_` and `sk_live_`

2. **Configure in Admin Settings:**
   - Login as admin
   - Navigate to Admin → Settings
   - Click **Payment Gateway** tab
   - Click **Test Mode** button
   - Paste test public key
   - Paste test secret key (use eye icon to verify)
   - Save settings

3. **When Ready for Production:**
   - Click **Live Mode** button
   - Paste live public key
   - Paste live secret key (use eye icon to verify)
   - Save settings
   - ⚠️ All payments will now use live credentials

4. **Configure Webhook:**
   - Copy webhook URL from settings page
   - Go to Paystack Dashboard → Settings → Webhooks
   - Paste webhook URL
   - Save in Paystack

---

## ✅ Testing Checklist

- [x] Syntax error fixed - plans page compiles
- [x] Test mode shows test key fields only
- [x] Live mode shows live key fields only
- [x] Mode toggle persists on save
- [x] Password visibility toggle works on login page
- [x] Password visibility toggle works on register page
- [x] Password visibility toggle works on SMTP settings
- [x] Password visibility toggle works on Paystack keys
- [x] Webhook URL displays correctly
- [x] Webhook URL copy button works
- [x] Toast notification shows on copy
- [x] Icon changes to checkmark after copy
- [x] Payment verification uses correct keys based on mode

---

## 🚀 Benefits

### For Administrators
- Easy switching between test and live environments
- No risk of accidentally using wrong keys
- Clear visual indicators of current mode
- Can verify password fields before saving
- Webhook URL readily available for setup

### For Users
- Can verify login credentials before submitting
- Reduces password typos and login failures
- Better user experience on registration
- Professional and polished interface

### For Developers
- Reusable PasswordInput component
- Clean separation of test and live configs
- Type-safe Paystack key retrieval
- Automatic mode-based key selection

---

## 📚 Files Modified

1. ✅ [src/app/(dashboard)/customer/plans/page.tsx](src/app/(dashboard)/customer/plans/page.tsx) - Fixed syntax error
2. ✅ [src/components/ui/password-input.tsx](src/components/ui/password-input.tsx) - Created new component
3. ✅ [src/components/admin/SystemSettingsForm.tsx](src/components/admin/SystemSettingsForm.tsx) - Added mode toggle, webhook URL, password inputs
4. ✅ [src/lib/paystack.ts](src/lib/paystack.ts) - Updated key retrieval logic
5. ✅ [src/app/actions/payment.ts](src/app/actions/payment.ts) - Updated to use new key function
6. ✅ [src/app/auth/login/page.tsx](src/app/auth/login/page.tsx) - Added password visibility
7. ✅ [src/app/auth/register/page.tsx](src/app/auth/register/page.tsx) - Added password visibility

---

## 🎉 All Features Successfully Implemented!

The system now has:
- ✅ Test/Live payment gateway toggle
- ✅ Password visibility controls
- ✅ Webhook URL display with copy
- ✅ Fixed compilation errors
- ✅ Enhanced security and UX
