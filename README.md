# Loft - Multi-Tenant Affiliate Management & E-Commerce Platform

A comprehensive Next.js platform combining affiliate marketing, subscription management, digital product sales, and flipbook content delivery with enterprise-level security.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (we recommend [Supabase](https://supabase.com))
- Paystack account for payments

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd loft

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Configure your database and services in .env.local
# See Environment Variables section below

# Run database migrations
npx prisma db push

# Seed the database with initial data
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Default Admin Credentials:**
- Email: `joseph@themewire.co`
- Password: `password123`

⚠️ **Important:** Change the admin password immediately after first login!

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Technology Stack](#-technology-stack)
- [Features](#-features)
- [User Roles](#-user-roles)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Payment Integration](#-payment-integration)
- [Security Features](#-security-features)
- [Commission System](#-commission-system)
- [File Uploads](#-file-uploads)
- [Email Configuration](#-email-configuration)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)

---

## 📖 Project Overview

Loft is a multi-tenant platform enabling:

- **Hierarchical Affiliate Management** - Admin → Managers → Affiliates → Customers
- **Subscription-Based Access** - Digital flipbook content delivery
- **Product Marketplace** - Customizable digital and physical product sales
- **Commission Tracking** - Automated commission calculation and payout management
- **Role-Based Access Control** - Four distinct user types with specific permissions

---

## 🛠 Technology Stack

### Frontend
- **Framework:** Next.js 16.1.1 (App Router with Turbopack)
- **UI Library:** shadcn/ui with Radix UI primitives
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod validation
- **State Management:** React Context API

### Backend
- **Runtime:** Node.js with Next.js API Routes
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Authentication:** NextAuth.js 5.0.0-beta.30
- **File Storage:** Supabase Storage
- **Email:** Nodemailer
- **Payment Gateway:** Paystack

### Security
- **Password Hashing:** bcryptjs
- **Rate Limiting:** @upstash/ratelimit with in-memory fallback
- **Security Headers:** Custom middleware (CSP, HSTS, X-Frame-Options)
- **Token Hashing:** SHA-256 for password resets and email verification

---

## ✨ Features

### 🔐 Authentication & Security
- ✅ Email/password authentication with NextAuth
- ✅ Email verification required for new users
- ✅ Account lockout after 5 failed login attempts (15 minutes)
- ✅ Hashed password reset tokens (SHA-256)
- ✅ Rate limiting on login, API, password reset, and email verification
- ✅ Comprehensive security headers (CSP, HSTS, X-Frame-Options, etc.)
- ✅ Enhanced input validation with Zod schemas

### 👥 User Management
- Multi-role system (Admin, Manager, Affiliate, Customer)
- Hierarchical invite system with unique codes
- Profile management with international phone numbers
- User suspension and status management
- Activity logging and audit trails

### 💰 Payment & Subscriptions
- Paystack integration for subscriptions and products
- Test/Live mode toggle for API keys
- Subscription plan management
- Automatic renewal handling
- Payment verification and webhook support

### 📚 Digital Content
- PDF flipbook viewer with page flip animations
- Reading progress tracking
- Subscription-based access control
- Cover image and thumbnail generation

### 🛍️ E-Commerce
- Digital and physical product support
- Customizable product fields (text, select, file upload)
- Order management and tracking
- Stock management for physical products
- Commission-based affiliate sales

### 💵 Commission System
- Automated commission calculation
- Multiple commission types (signup, subscription, product)
- Payout request management
- Manager-level commission tracking
- Approval workflow

### 📊 Analytics & Reporting
- Role-specific dashboards
- Revenue tracking and charts
- Team performance metrics
- Activity feeds and notifications
- Commission history

### ⚙️ System Settings (Admin)
- SMTP configuration with test email
- Paystack test/live mode toggle
- Commission rate configuration
- Email template customization
- Platform branding settings

---

## 👤 User Roles

### Admin
- Full system control
- User management
- Content creation (flipbooks, products, plans)
- Commission approval
- Payout processing
- System settings configuration

### Manager
- Manage affiliate team
- Generate invite links for affiliates and customers
- View team performance and earnings
- Request payouts
- Limited user management (own team)

### Affiliate
- Generate customer invite links
- Track referrals and conversions
- View earnings and commissions
- Request payouts
- Product promotion

### Customer
- Access subscribed content (flipbooks)
- Purchase products
- Track orders
- Manage profile and subscriptions
- View activity history

---

## 🔧 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host:6543/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/database"

# NextAuth
AUTH_SECRET="your-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Supabase (for file uploads)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="your-anon-key"

# Paystack (optional - can be configured via admin settings)
PAYSTACK_PUBLIC_KEY="pk_test_xxxxxxxxxx"
PAYSTACK_SECRET_KEY="sk_test_xxxxxxxxxx"

# Upstash Redis (optional - for production rate limiting)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

### Key Generation

Generate a secure `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

## 🗄️ Database Setup

### Using Supabase (Recommended)

1. Create a free account at [Supabase](https://supabase.com)
2. Create a new project
3. Go to **Settings → Database**
4. Copy the connection strings:
   - **Connection pooling** (port 6543) → `DATABASE_URL`
   - **Direct connection** (port 5432) → `DIRECT_URL`
5. Update `.env.local` with your connection strings

### Run Migrations

```bash
# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed initial data (creates admin user)
npx tsx prisma/seed.ts

# Open Prisma Studio to view data
npx prisma studio
```

### Database Schema

The schema includes 15+ models:
- Users (polymorphic for all roles)
- Subscriptions & Plans
- Products & Orders
- Flipbooks & Progress
- Commissions & Payouts
- Activity Logs
- System Settings
- Email Verification & Password Reset Tokens

View the complete schema in `prisma/schema.prisma`.

---

## 💳 Payment Integration

### Paystack Setup

1. **Get API Keys:**
   - Sign up at [Paystack](https://paystack.com)
   - Get test keys from **Settings → API Keys**
   - Test keys start with `pk_test_` and `sk_test_`

2. **Configure in Admin Settings:**
   - Login as admin
   - Navigate to **Settings → Payment Gateway**
   - Select **Test Mode**
   - Enter Paystack Test Public Key
   - Enter Paystack Test Secret Key
   - Save settings

3. **Test Subscription/Purchase:**
   - Use test card: `4084084084084081`
   - CVV: `408`
   - Expiry: Any future date
   - PIN: `0000` or `1234`

4. **Configure Webhook:**
   - Copy webhook URL from settings: `https://yourdomain.com/api/webhooks/paystack`
   - Add to Paystack Dashboard → **Settings → Webhooks**

5. **Go Live:**
   - Switch to **Live Mode** in settings
   - Enter live API keys
   - Test with small real transaction
   - Monitor activity logs

### Payment Features

- ✅ Subscription checkout
- ✅ Product purchases
- ✅ Payment verification
- ✅ Automatic commission processing
- ✅ Webhook support
- ✅ Amount tampering prevention
- ✅ Test/Live mode toggle

---

## 🔒 Security Features

### Enterprise-Level Security

1. **Rate Limiting**
   - Login: 5 attempts per 15 minutes
   - API: 100 requests per minute
   - Password reset: 3 requests per hour
   - Email verification: 5 requests per hour

2. **Security Headers**
   - Content Security Policy (CSP)
   - HTTP Strict Transport Security (HSTS)
   - X-Frame-Options (clickjacking protection)
   - X-Content-Type-Options (MIME sniffing protection)
   - Referrer-Policy
   - Permissions-Policy

3. **Account Protection**
   - Account lockout after 5 failed login attempts
   - 15-minute lockout duration
   - Automatic unlock after timeout
   - Failed attempt tracking

4. **Email Verification**
   - Required for all new users (except admin)
   - 24-hour token expiration
   - SHA-256 hashed tokens
   - Secure verification links

5. **Password Security**
   - bcryptjs hashing with salt rounds
   - Minimum 8 characters, uppercase, lowercase, number
   - Hashed password reset tokens
   - Visibility toggle on forms

6. **Input Validation**
   - Zod schemas for all forms
   - File upload restrictions (10MB, specific types)
   - Email format validation
   - Phone number validation
   - HTML sanitization

### Performance Optimizations

- ✅ In-memory caching for system settings (5-minute TTL)
- ✅ Dynamic rendering for authenticated pages
- ✅ Static generation for public pages
- ✅ Query optimization with Prisma
- ✅ Build time: **9.9 seconds** (70% faster)

---

## 💰 Commission System

### Commission Types

#### 1. Signup Commissions
- **Affiliate:** GHS 5.00 per customer signup
- **Manager:** GHS 5.00 only for direct signups (not from their affiliates' customers)

#### 2. Subscription Commissions
- **Affiliate:** Fixed amount from system settings (e.g., GHS 10.00)
- **Manager:** 20% of subscription price when their affiliate's customer subscribes

#### 3. Product Commissions
- **Affiliate:** Amount defined per product by admin
- **Manager:** 20% of product price when their affiliate's customer purchases

### Examples

**Example 1: Customer subscribes (GHS 50 plan)**
- Customer pays: GHS 50
- Affiliate earns: GHS 10 (from settings)
- Manager earns: GHS 10 (20% of GHS 50)
- Platform retains: GHS 30

**Example 2: Product purchase (GHS 100, GHS 15 affiliate commission)**
- Customer pays: GHS 100
- Affiliate earns: GHS 15 (product-specific)
- Manager earns: GHS 20 (20% of GHS 100)
- Platform retains: GHS 65

### Payout Process

1. Affiliates/Managers request payout (minimum GHS 50)
2. Admin reviews commission history
3. Admin approves or rejects request
4. Payment processed via mobile money or bank transfer
5. Commission status updated to PAID
6. Email notification sent

---

## 📁 File Uploads

### Supabase Storage Setup

1. **Create Storage Bucket:**
   - Go to Supabase → **Storage**
   - Create public bucket named `uploads`
   - Enable public access

2. **Set Row Level Security (RLS) Policy:**
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Allow authenticated uploads" ON storage.objects
   FOR INSERT TO authenticated
   WITH CHECK (bucket_id = 'uploads');

   -- Allow public read access
   CREATE POLICY "Allow public downloads" ON storage.objects
   FOR SELECT TO public
   USING (bucket_id = 'uploads');
   ```

3. **Upload Restrictions:**
   - Max file size: 10MB
   - Allowed types: PDF, images (JPEG, PNG, GIF, WebP), TXT, DOC, DOCX
   - File name validation (no directory traversal)

---

## 📧 Email Configuration

### SMTP Setup

1. **Configure in Admin Settings:**
   - Navigate to **Settings → SMTP**
   - Enter SMTP host (e.g., smtp.gmail.com)
   - Enter SMTP port (587 for TLS, 465 for SSL)
   - Enter SMTP username (email address)
   - Enter SMTP password or app password
   - Set sender email and name
   - Click **Send Test Email** to verify

2. **Gmail Example:**
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: `your-email@gmail.com`
   - Password: Use [App Password](https://support.google.com/accounts/answer/185833)

### Email Templates

The system includes 14+ email templates:
- Welcome emails (role-specific)
- Email verification
- Password reset
- Subscription confirmation
- Order confirmation
- Commission notifications
- Payout status updates

All templates support dynamic currency from system settings.

---

## 🚀 Deployment

### Vercel (Recommended)

1. **Prepare for Deployment:**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel:**
   ```bash
   npm i -g vercel
   vercel
   ```

3. **Configure Environment Variables:**
   - Add all `.env.local` variables in Vercel dashboard
   - Go to **Project Settings → Environment Variables**

4. **Set Production URL:**
   - Update `NEXTAUTH_URL` to your production domain
   - Update Paystack webhook URL

5. **Database Connection:**
   - Ensure production database is accessible
   - Use connection pooling for better performance

### Build Configuration

The `postinstall` script automatically runs `prisma generate` during deployment:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

---

## 📂 Project Structure

```
loft/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding
├── public/
│   └── uploads/               # Local file uploads (dev only)
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   │   ├── admin/         # Admin pages
│   │   │   ├── manager/       # Manager pages
│   │   │   ├── affiliate/     # Affiliate pages
│   │   │   ├── customer/      # Customer pages
│   │   │   └── settings/      # Settings page
│   │   ├── auth/              # Authentication pages
│   │   ├── actions/           # Server actions
│   │   └── api/               # API routes
│   │       ├── auth/          # NextAuth endpoints
│   │       ├── upload/        # File upload endpoint
│   │       └── webhooks/      # Webhook handlers
│   ├── components/
│   │   ├── admin/             # Admin components
│   │   ├── affiliate/         # Affiliate components
│   │   ├── dashboard/         # Shared dashboard components
│   │   ├── finance/           # Finance components
│   │   ├── flipbook/          # Flipbook components
│   │   ├── layout/            # Layout components
│   │   ├── manager/           # Manager components
│   │   ├── payment/           # Payment components
│   │   ├── product/           # Product components
│   │   ├── ui/                # UI primitives (shadcn/ui)
│   │   └── user/              # User components
│   ├── lib/
│   │   ├── cache.ts           # In-memory caching
│   │   ├── commission.ts      # Commission logic
│   │   ├── email.ts           # Email service
│   │   ├── logger.ts          # Activity logging
│   │   ├── paystack.ts        # Paystack integration
│   │   ├── prisma.ts          # Prisma client
│   │   ├── ratelimit.ts       # Rate limiting
│   │   ├── supabase.ts        # Supabase client
│   │   ├── types.ts           # TypeScript types
│   │   ├── upload.ts          # File upload logic
│   │   ├── utils.ts           # Utility functions
│   │   └── validations.ts     # Zod schemas
│   ├── auth.ts                # NextAuth configuration
│   └── middleware.ts          # Security headers
├── .env.local                 # Environment variables
├── components.json            # shadcn/ui config
├── next.config.ts             # Next.js config
├── package.json               # Dependencies
├── tailwind.config.ts         # Tailwind config
└── tsconfig.json              # TypeScript config
```

**Note:** Recent updates (2026-05-11): Flipbook age-group handling normalized; Bookshelf component fixed; `category` validation removed. See `docs/changes/2026-05-11-flipbook-agegroup.md` for details.

---

## 👨‍💻 Development

### Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Database Management

```bash
# View/edit data in browser
npx prisma studio

# Reset database (careful!)
npx prisma migrate reset

# Generate Prisma Client after schema changes
npx prisma generate
```

### Code Quality

```bash
# Type checking
npm run build

# Format code (if using Prettier)
npm run format

# Lint (if using ESLint)
npm run lint
```

### Performance Optimization

The application uses several optimization techniques:
- Server components by default
- Dynamic imports for heavy components
- In-memory caching for frequently accessed data
- Optimized database queries with Prisma
- Static generation for public pages
- Image optimization with Next.js Image

---

## 🧪 Testing

### Manual Testing Checklist

**Authentication:**
- [ ] User registration (all roles)
- [ ] Email verification flow
- [ ] Login with correct credentials
- [ ] Login with incorrect credentials (account lockout)
- [ ] Password reset flow
- [ ] Logout

**Subscriptions:**
- [ ] Subscribe to plan (test mode)
- [ ] Access flipbooks after subscription
- [ ] Subscription renewal
- [ ] Subscription cancellation

**Products:**
- [ ] Browse products
- [ ] Purchase product (test mode)
- [ ] View order status
- [ ] Download digital products

**Commissions:**
- [ ] Affiliate signup commission
- [ ] Subscription commission (affiliate + manager)
- [ ] Product commission (affiliate + manager)
- [ ] Payout request
- [ ] Payout approval (admin)

**Admin:**
- [ ] Create users
- [ ] Create flipbooks
- [ ] Create products
- [ ] Manage orders
- [ ] Approve payouts
- [ ] Update system settings

### Test Accounts

After seeding, you'll have:
- **Admin:** joseph@themewire.co / password123

Create additional test accounts for each role to test the full hierarchy.

---

## 🔧 Troubleshooting

### Build Issues

**Issue:** Prisma Client not generated
```bash
npx prisma generate
```

**Issue:** Type errors after schema changes
```bash
rm -rf node_modules/.prisma
npx prisma generate
npm run build
```

### Database Issues

**Issue:** Connection refused
- Check `DATABASE_URL` and `DIRECT_URL` are correct
- Verify database is running and accessible
- Check firewall rules

**Issue:** Migration conflicts
```bash
npx prisma db push --force-reset
npx tsx prisma/seed.ts
```

### Authentication Issues

**Issue:** Can't login after password change
- Password hash might be incorrect
- Generate new hash: `node -e "console.log(require('bcryptjs').hashSync('newpassword', 10))"`
- Update directly in database

**Issue:** Email verification not working
- Check SMTP configuration
- Verify email service is sending
- Check spam folder
- Test with "Send Test Email" button

### Payment Issues

**Issue:** Paystack modal not opening
- Check public key is set in system settings
- Verify Paystack script is loading
- Check browser console for errors

**Issue:** Payment verification fails
- Verify secret key is correct
- Check webhook URL is configured
- Review activity logs for errors

### File Upload Issues

**Issue:** Upload fails
- Check Supabase bucket exists and is public
- Verify RLS policies are set
- Check file size and type restrictions
- Review browser console for errors

### Performance Issues

**Issue:** Slow page loads
- Check database query performance
- Enable caching for frequently accessed data
- Use database indexes for large tables
- Consider upgrading database plan

### Common Error Messages

**"Invalid credentials or email not verified"**
- Either password is wrong OR email not verified
- Check inbox for verification email
- Resend verification if needed

**"Account locked until [time]"**
- 5 failed login attempts triggered lockout
- Wait 15 minutes or reset via admin

**"Insufficient funds for payout"**
- Pending balance below minimum (GHS 50)
- Wait for more commissions or reduce minimum

---

## 📞 Support

### Getting Help

1. Check this README thoroughly
2. Review error messages in browser console
3. Check server logs for backend errors
4. Review activity logs in admin dashboard
5. Consult Prisma/Next.js documentation

### Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Paystack Documentation](https://paystack.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

---

## � Additional Documentation

Project-specific documentation is in the `/docs` folder:

- **[Subscription Expiration](docs/SUBSCRIPTION_EXPIRATION.md)** - Subscription lifecycle, free plan assignment, and cron setup
- **[Performance Optimizations](docs/PERFORMANCE_OPTIMIZATIONS.md)** - Database indexes, caching strategies, and optimization techniques
- **[Optimization Summary](docs/OPTIMIZATION_SUMMARY.md)** - Quick reference for all performance improvements

---

## 📄 License

This project is proprietary software. All rights reserved. See [LICENSE](LICENSE) for details.

## 📜 Legal Documents

- [Privacy Policy](docs/PRIVACY_POLICY.md) - How we collect and use your data
- [Terms of Service](docs/TERMS_OF_SERVICE.md) - Rules for using the platform
- [Cookie Policy](docs/COOKIE_POLICY.md) - Information about cookies and tracking
- [Acceptable Use Policy](docs/ACCEPTABLE_USE_POLICY.md) - Prohibited activities and enforcement

**Important:** Review these documents carefully before using or deploying this platform.

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org) - React framework
- [Prisma](https://prisma.io) - Database ORM
- [NextAuth.js](https://next-auth.js.org) - Authentication
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Paystack](https://paystack.com) - Payment gateway
- [Supabase](https://supabase.com) - Database & storage

---

## Deployment Preconditions

The self-hosted flipbook pipeline requires two system binaries on the host:

- `ghostscript` — PDF compression (`gs -dPDFSETTINGS=/ebook`)
- `poppler-utils` — PDF page rendering (`pdftocairo`)

**Debian / Ubuntu / Plesk:**
```bash
sudo apt-get update && sudo apt-get install -y ghostscript poppler-utils
```

**RHEL / CentOS:**
```bash
sudo yum install -y ghostscript poppler-utils
```

If either binary is missing, PDF uploads fail with a clear error and admin can still publish via Heyzine.

---

**Last Updated:** January 11, 2026  
**Version:** 1.0.0

## Recent updates

- 2026-05-11: Normalize flipbook age-group handling: variants like "All Ages", "all age groups", and empty values are treated as "all". Queries now match case-insensitively so published flipbooks for "All Ages" show up on child dashboards.
- 2026-05-11: Removed `category` from product/flipbook validation — categories are no longer used for grouping/shelves.
- 2026-05-11: Fixed Bookshelf JSX parse/layout bug so child dashboard renders correctly.
- 2026-05-11: Added docs/changes/2026-05-11-flipbook-agegroup.md with more details and testing notes.

