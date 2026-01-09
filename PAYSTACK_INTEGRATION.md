# Paystack Payment Integration

This project integrates Paystack as the payment gateway for all subscriptions and product purchases.

## Setup

### 1. Get Paystack API Keys

1. Sign up at [Paystack](https://paystack.com/)
2. Get your **Public Key** and **Secret Key** from the dashboard
3. For testing, use test keys (starts with `pk_test_` and `sk_test_`)
4. For production, use live keys (starts with `pk_live_` and `sk_live_`)

### 2. Configure in System Settings

As an admin:
1. Navigate to **Admin → Settings**
2. Go to the **Payment Gateway** tab
3. Enter your Paystack Public Key
4. Enter your Paystack Secret Key
5. Click **Save Changes**

### 3. Environment Variables (Optional Fallback)

You can also set these in your `.env` file as fallback:

```env
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Features

### Subscription Payments

- Customers can subscribe to plans via Paystack checkout
- Payment is verified before activating subscription
- Automatic commission processing for referrers
- Activity logging for all transactions

### Product Purchases

- Customers can purchase products via Paystack checkout
- Payment verification before order creation
- Commission processing for affiliates
- Order tracking and activity logging

### Payment Verification

- Automatic payment verification using Paystack API
- Amount verification to prevent fraud
- Webhook support for real-time updates
- Transaction reference tracking

## Webhook Configuration

To receive real-time payment updates:

1. Go to your Paystack Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/paystack`
3. Paystack will send events like `charge.success` to this endpoint

## Testing

### Test Cards

Use these test cards in Paystack's test mode:

**Successful Payment:**
- Card Number: `4084084084084081`
- CVV: `408`
- Expiry: Any future date
- PIN: `0000` or `1234`

**Failed Payment:**
- Card Number: `5060666666666666666`
- CVV: `123`
- Expiry: Any future date

More test cards: https://paystack.com/docs/payments/test-payments/

## File Structure

```
src/
├── lib/
│   └── paystack.ts                      # Paystack utility functions
├── components/
│   └── payment/
│       ├── PaystackButton.tsx          # Reusable payment button
│       ├── SubscribePlanButton.tsx     # Subscription payment
│       └── PurchaseProductButton.tsx   # Product purchase payment
├── app/
│   ├── actions/
│   │   └── payment.ts                  # Payment processing actions
│   └── api/
│       └── webhooks/
│           └── paystack/
│               └── route.ts            # Webhook handler
```

## Payment Flow

### Subscription Flow

1. Customer clicks "Subscribe" on a plan
2. Paystack checkout modal opens
3. Customer completes payment
4. Payment is verified via Paystack API
5. Subscription is created and activated
6. Commission is processed for referrer
7. Activity is logged
8. Page refreshes to show new subscription

### Product Purchase Flow

1. Customer clicks "Buy Now" on a product
2. Paystack checkout modal opens
3. Customer completes payment
4. Payment is verified via Paystack API
5. Order is created with PROCESSING status
6. Commission is created for affiliate (if referred)
7. Activity is logged
8. Success message shown

## Security

- API keys stored securely in database or environment variables
- Webhook signature verification
- Amount verification to prevent tampering
- Server-side payment verification
- No sensitive data exposed to client

## Currency

All amounts are in **Ghana Cedis (GHS)**.

Paystack expects amounts in **pesewas** (smallest unit), so:
- 1 GHS = 100 pesewas
- All amounts are automatically converted when sending to Paystack

## Troubleshooting

### Payment not processing

1. Check that Paystack keys are correctly configured
2. Verify keys match environment (test keys for test mode)
3. Check browser console for errors
4. Verify Paystack script is loading

### Webhook not working

1. Verify webhook URL is correct in Paystack dashboard
2. Check that your server is accessible from internet
3. Verify webhook signature validation is working
4. Check server logs for webhook errors

### Amount mismatch errors

1. Verify plan/product price is set correctly
2. Check that amount conversion (GHS to pesewas) is working
3. Ensure no price modifications during payment flow

## Support

For Paystack-specific issues:
- Documentation: https://paystack.com/docs
- Support: support@paystack.com

For integration issues in this project:
- Check application logs
- Review activity logs in admin dashboard
- Contact system administrator
