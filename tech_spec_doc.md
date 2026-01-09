# Technical Specification Document: Multi-Tenant Affiliate Management & E-Commerce Platform

## Executive Summary

This document outlines the technical architecture, features, and implementation plan for a multi-tenant web application combining affiliate marketing, subscription management, digital/physical product sales, and flipbook content delivery.

---

## 1. Project Overview

### 1.1 Purpose

Build a comprehensive multi-tenant platform enabling:

- Hierarchical affiliate management (Admin → Managers → Affiliates → Customers)
- Subscription-based access to digital flipbooks
- Product marketplace with customizable orders
- Commission tracking and payout management
- Role-based access control across four user types

### 1.2 Target Users

- **Admin**: Platform owner with full system control
- **Managers**: Team leads managing affiliate groups
- **Affiliates**: Direct marketers recruiting customers
- **Customers/Subscribers**: End users accessing content and products

---

## 2. Technology Stack Recommendation

### 2.1 Frontend

- **Framework**: Next.js 14+ (App Router)
- **UI Library**: shadcn/ui with Radix UI primitives
- **Icons**: Lucide React (thin variant)
- **Styling**: Tailwind CSS
- **State Management**: React Context API + Zustand (for complex state)
- **Forms**: React Hook Form + Zod validation
- **Data Fetching**: TanStack Query (React Query)

### 2.2 Backend

- **Framework**: Next.js API Routes / Node.js with Express
- **Database**: PostgreSQL (relational data structure ideal for hierarchical relationships)
- **ORM**: Prisma
- **Authentication**: NextAuth.js / Clerk
- **File Storage**: AWS S3 / Cloudinary (for images, PDFs)
- **Email Service**: Nodemailer (configurable SMTP)
- **Payment Gateway**: Paystack API

### 2.3 Additional Services

- **PDF/Flipbook Rendering**: Turn.js / PDF.js + custom flip animation
- **QR Code Generation**: qrcode.react
- **Phone Number Validation**: libphonenumber-js
- **Image Optimization**: Next.js Image component + Sharp

### 2.4 DevOps & Hosting

- **Hosting**: Vercel / AWS / DigitalOcean
- **Database Hosting**: Supabase / Railway / AWS RDS
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry (error tracking), Vercel Analytics

---

## 3. Database Schema Design

### 3.1 Core Tables

```sql
-- Users (polymorphic for all user types)
users
  - id (UUID, PK)
  - email (unique)
  - password_hash
  - role (enum: ADMIN, MANAGER, AFFILIATE, CUSTOMER)
  - first_name
  - last_name
  - phone_number
  - profile_picture_url
  - manager_id (FK to users, nullable) -- for affiliates
  - invite_code (unique) -- for managers and affiliates
  - referred_by_id (FK to users, nullable) -- for customers
  - status (enum: ACTIVE, SUSPENDED, PENDING)
  - created_at
  - updated_at

-- Invitations
invitations
  - id (UUID, PK)
  - inviter_id (FK to users)
  - invitee_email
  - invite_type (enum: AFFILIATE, CUSTOMER)
  - token (unique)
  - expires_at
  - used_at (nullable)
  - created_at

-- Subscriptions
subscriptions
  - id (UUID, PK)
  - customer_id (FK to users)
  - plan_id (FK to subscription_plans)
  - status (enum: ACTIVE, EXPIRED, CANCELLED)
  - start_date
  - end_date
  - auto_renew (boolean)
  - created_at
  - updated_at

subscription_plans
  - id (UUID, PK)
  - name
  - description
  - price
  - duration_days
  - features (JSON)
  - is_active (boolean)
  - created_at
  - updated_at

-- Flipbooks
flipbooks
  - id (UUID, PK)
  - title
  - description
  - cover_image_url
  - pdf_url
  - total_pages
  - is_published (boolean)
  - created_by (FK to users)
  - created_at
  - updated_at

flipbook_progress
  - id (UUID, PK)
  - customer_id (FK to users)
  - flipbook_id (FK to flipbooks)
  - last_page_read
  - completed (boolean)
  - last_accessed_at
  - created_at

-- Products
products
  - id (UUID, PK)
  - title
  - description
  - product_type (enum: DIGITAL, PHYSICAL)
  - price
  - featured_image_url
  - affiliate_commission_amount
  - is_active (boolean)
  - stock_quantity (nullable, for physical)
  - digital_file_url (nullable, for digital)
  - requires_customization (boolean)
  - customization_fields (JSON) -- dynamic form fields
  - created_at
  - updated_at

-- Orders
orders
  - id (UUID, PK)
  - order_number (unique)
  - customer_id (FK to users)
  - product_id (FK to products)
  - quantity
  - unit_price
  - total_amount
  - customization_data (JSON)
  - status (enum: PENDING, PROCESSING, COMPLETED, CANCELLED)
  - payment_status (enum: PENDING, PAID, FAILED, REFUNDED)
  - payment_reference
  - referred_by_id (FK to users) -- affiliate who referred
  - created_at
  - updated_at

-- Commissions
commissions
  - id (UUID, PK)
  - user_id (FK to users) -- affiliate or manager
  - source_type (enum: SIGNUP, SUBSCRIPTION, PRODUCT, MANAGER_DIRECT_SIGNUP)
  - source_id (FK polymorphic) -- order_id, subscription_id, or user_id
  - amount
  - status (enum: PENDING, APPROVED, PAID)
  - created_at
  - paid_at (nullable)

-- Payout Requests
payout_requests
  - id (UUID, PK)
  - user_id (FK to users)
  - amount
  - status (enum: PENDING, APPROVED, REJECTED, PAID)
  - requested_at
  - processed_at (nullable)
  - admin_notes (text, nullable)
  - payment_method (JSON) -- bank details, mobile money, etc.

-- System Settings
system_settings
  - id (UUID, PK)
  - key (unique)
  - value (JSON)
  - updated_at

-- Activity Logs
activity_logs
  - id (UUID, PK)
  - user_id (FK to users)
  - action_type (enum)
  - action_details (JSON)
  - ip_address
  - created_at
```

### 3.2 Key Relationships

- **Hierarchical Structure**: Affiliates → Manager (many-to-one)
- **Referral Chain**: Customers → Affiliate/Manager (many-to-one)
- **Commission Flow**: Orders/Subscriptions → Commissions → Users

---

## 4. User Roles & Permissions Matrix

| Feature               | Admin | Manager       | Affiliate | Customer       |
| --------------------- | ----- | ------------- | --------- | -------------- |
| System Settings       | ✓     | -             | -         | -              |
| User Management       | ✓     | View own team | -         | -              |
| Create Flipbooks      | ✓     | -             | -         | -              |
| View Flipbooks        | ✓     | -             | -         | ✓ (subscribed) |
| Create Products       | ✓     | -             | -         | -              |
| View Products         | ✓     | ✓             | ✓         | ✓              |
| Place Orders          | -     | -             | -         | ✓              |
| Manage Orders         | ✓     | -             | -         | View own       |
| Generate Invite Links | -     | ✓             | ✓         | -              |
| Request Payouts       | -     | ✓             | ✓         | -              |
| Approve Payouts       | ✓     | -             | -         | -              |
| View All Commissions  | ✓     | Own team      | Own       | -              |
| View Analytics        | ✓     | Own team      | Own       | Own activity   |

---

## 5. Feature Specifications

### 5.1 Authentication & User Management

#### Sign Up Flow

1. **Admin**: Manual account creation (seeded or first-user registration)
2. **Manager**: Admin creates manager accounts or managers self-register with admin approval
3. **Affiliate**:
   - Requires manager's invite link or code
   - Form includes: name, email, phone, password, manager_code
   - Automatically linked to manager on registration
4. **Customer**:
   - Requires affiliate or manager invite link
   - Form includes: name, email, phone, password, referral_code
   - System tracks referrer for commission attribution

#### Invite System

- **Manager Invite Link**: `https://platform.com/join/manager/{manager_invite_code}`
- **Affiliate Invite Link**: `https://platform.com/join/affiliate/{affiliate_invite_code}`
- **Customer Invite Links**:
  - From Manager: `https://platform.com/signup?ref={manager_code}`
  - From Affiliate: `https://platform.com/signup?ref={affiliate_code}`
- **QR Code Generation**: Generate QR codes for all invite links

#### Profile Management

All users can edit:

- Profile picture (upload with image cropping)
- First name, last name
- Email address (with verification)
- International phone number (with country code selector)
- Password (with current password confirmation)

---

### 5.2 Commission Logic

#### 5.2.1 Signup Commissions

- **Affiliate**: Earns GHS 5.00 per customer signup
- **Manager**: Earns GHS 5.00 only when they directly signup a customer (not from their affiliates' customers)

#### 5.2.2 Subscription Commissions

- **Affiliate**: Earns fixed amount set globally in system settings (e.g., GHS 10.00 per subscription)
- **Manager**: Earns 20% of the subscription price when their affiliate's customer subscribes

#### 5.2.3 Product Commissions

- **Affiliate**: Earns amount defined per product by admin
- **Manager**: Earns 20% of the product price when their affiliate's customer purchases

#### 5.2.4 Commission Calculation Examples

**Example 1: Customer subscribes (GHS 50 plan)**

- Customer pays: GHS 50
- Affiliate earns: GHS 10 (from system settings)
- Manager earns: GHS 10 (20% of GHS 50 subscription price)
- Platform retains: GHS 30

**Example 2: Customer buys product (GHS 100 product, GHS 15 affiliate commission)**

- Customer pays: GHS 100
- Affiliate earns: GHS 15 (product-specific commission set by admin)
- Manager earns: GHS 20 (20% of GHS 100 product price)
- Platform retains: GHS 65

**Example 3: Manager directly signs up customer who subscribes (GHS 50 plan)**

- Customer pays: GHS 50
- Manager earns: GHS 5 (signup bonus) + GHS 10 (20% of GHS 50)
- Platform retains: GHS 35

**Example 4: Affiliate signs up customer (no purchase yet)**

- Affiliate earns: GHS 5 (signup bonus)
- Manager earns: GHS 0 (no earnings on free signups by affiliates)

---

### 5.3 Dashboard Pages

#### 5.3.1 Admin Dashboard (Overview)

**KPIs**:

- Total Revenue (current month, previous month comparison)
- Total Active Subscriptions
- Total Active Managers, Affiliates, Customers
- Pending Payout Requests
- Recent Orders Count
- Total Flipbooks Published
- Total Products Available

**Charts**:

- Revenue trend (line chart, last 12 months)
- Subscription growth (area chart)
- Top performing affiliates (bar chart)
- Order status breakdown (donut chart)

**Recent Activity Feed**:

- New user registrations
- New orders
- Payout requests
- Subscription renewals

---

#### 5.3.2 Manager Dashboard (Overview)

**KPIs**:

- Total Team Members (affiliates)
- Total Customers Referred (by entire team)
- Team Total Earnings
- Manager Personal Earnings
- Pending Payout Balance
- Active Customers with Subscriptions

**Charts**:

- Team performance over time
- Top performing affiliates in team
- Customer acquisition trend

**Quick Actions**:

- Generate affiliate invite link/QR code
- Generate customer invite link/QR code
- View team members
- Request payout

**Activity Feed**:

- Affiliate signups
- Customer conversions
- Commission earnings
- Team milestones

---

#### 5.3.3 Affiliate Dashboard (Overview)

**KPIs**:

- Total Customers Referred
- Active Subscribers
- Total Earnings
- Pending Balance
- Lifetime Earnings
- This Month's Earnings

**Charts**:

- Earnings over time (last 6 months)
- Customer acquisition trend
- Conversion rate

**Quick Actions**:

- Generate customer invite link/QR code
- Request payout

**Activity Feed**:

- New customer signups
- Customer subscriptions
- Customer purchases
- Commission earnings

---

#### 5.3.4 Customer Dashboard (Overview)

**KPIs**:

- Current Subscription Status
- Subscription Expiry Date
- Flipbooks Read / Total Available
- Orders Placed
- Account Credit Balance (if applicable)

**Quick Access**:

- Renew subscription (if expiring soon)
- Browse flipbooks
- Browse products
- View orders

**Recent Activity**:

- Recently read flipbooks
- Recent purchases
- Subscription history

---

### 5.4 Flipbook Management

#### 5.4.1 Admin - Create Flipbook

**Form Fields**:

- Title (required)
- Description (rich text editor)
- Cover image upload (max 5MB, jpg/png)
- PDF upload (max 50MB)
- Published status (toggle)
- Tags/Categories (optional, for filtering)

**Process**:

1. Upload PDF to cloud storage
2. Extract page count using PDF.js
3. Generate thumbnail images for each page (background job)
4. Store metadata in database

---

#### 5.4.2 Customer - View Flipbooks

**List View**:

- Grid layout with cover images
- Title and description preview
- "Read Now" button (if subscribed) or "Subscribe to Read" (if not)
- Progress indicator (X% complete)
- Filter by category/tags
- Search functionality

**Reading View**:

- Full-screen flipbook reader
- Page flip animation (using Turn.js or custom CSS)
- Navigation: next/previous buttons, page number input, thumbnail sidebar
- Progress tracking (auto-save current page)
- Responsive design (mobile: single page view, desktop: double-page spread)
- Zoom in/out functionality
- Bookmark feature

**Technical Implementation**:

- Convert PDF pages to images on upload (better performance)
- Lazy load pages as user navigates
- Track reading progress in `flipbook_progress` table
- Cache frequently accessed flipbooks

---

### 5.5 Product Management

#### 5.5.1 Admin - Create Product

**Form Fields**:

- Product Title (required)
- Description (rich text editor)
- Product Type (select: Digital / Physical)
- Price (GHS, required)
- Featured Image (upload, max 5MB)
- Additional Images (gallery, up to 5 images)
- Affiliate Commission Amount (GHS)
- Stock Quantity (for physical products only)
- Digital File Upload (for digital products, max 100MB)
- Requires Customization (checkbox)
  - If yes: Dynamic form builder for customization fields
    - Field types: text, textarea, select, file upload
    - Field label, placeholder, required/optional
- Published Status (toggle)

**Customization Example**:

```json
{
  "customization_fields": [
    {
      "type": "text",
      "label": "Name for Engraving",
      "placeholder": "Enter name",
      "required": true
    },
    {
      "type": "select",
      "label": "Size",
      "options": ["Small", "Medium", "Large"],
      "required": true
    },
    {
      "type": "file",
      "label": "Upload Design",
      "accept": "image/*",
      "required": false
    }
  ]
}
```

---

#### 5.5.2 Customer - View & Purchase Products

**Product Listing Page**:

- Grid layout with product cards
- Each card shows: image, title, price, "Buy Now" button
- Filter by type (Digital/Physical)
- Sort by: price (low to high), newest, popular
- Search functionality

**Product Detail Page**:

- Image gallery with zoom
- Title, description, price
- Customization form (if applicable)
- Quantity selector (for physical products)
- "Add to Cart" or "Buy Now" button
- Reviews/ratings (future enhancement)

**Checkout Flow**:

1. Review order details and customization
2. Enter shipping address (for physical products)
3. Select payment method (Paystack)
4. Payment processing
5. Order confirmation with order number

---

### 5.6 Order Management

#### 5.6.1 Admin - Orders Page

**Table Columns**:

- Order Number
- Customer Name
- Product Title
- Quantity
- Total Amount
- Status (badge with color coding)
- Payment Status (badge)
- Order Date
- Actions (View Details, Update Status, Cancel)

**Filters**:

- Status (Pending, Processing, Completed, Cancelled)
- Payment Status
- Date range
- Product type

**Order Detail Modal**:

- Complete order information
- Customer details
- Product details
- Customization data (formatted display)
- Shipping address (for physical)
- Payment reference
- Status update dropdown
- Admin notes field
- Order timeline (status changes)

**Actions**:

- Update order status (triggers email notification)
- Mark as paid (if manual payment)
- Generate invoice (PDF)
- Contact customer (email link)

---

#### 5.6.2 Customer - Orders Page

**List View**:

- Order cards showing:
  - Order number and date
  - Product image and title
  - Total amount
  - Current status with progress indicator
  - "Track Order" button

**Order Tracking Detail**:

- Order timeline visualization
  - Ordered → Processing → Shipped → Delivered (physical)
  - Ordered → Processing → Completed (digital)
- Download digital file (for digital products)
- View customization details
- Download invoice
- Contact support button

---

### 5.7 Commission & Payout Management

#### 5.7.1 Manager/Affiliate - Commission Page

**Summary Cards**:

- Total Earnings (all time)
- Available for Payout (approved commissions not yet paid)
- Pending Commissions (awaiting approval)
- This Month's Earnings

**Commission History Table**:

- Date
- Source (Signup, Subscription, Product Order)
- Customer Name
- Amount
- Status (Pending, Approved, Paid)
- Payout Date (if paid)

**Filters**:

- Date range
- Source type
- Status

**Request Payout**:

- Minimum payout amount check (e.g., GHS 50)
- Payment method selection form:
  - Mobile Money (number, network)
  - Bank Transfer (account details)
- Request button (creates payout_request record)

---

#### 5.7.2 Admin - Finance Page

**KPI Cards**:

- Total Revenue (current month)
- Total Commissions Paid
- Pending Payout Requests (count & amount)
- Net Profit Margin

**Charts**:

- Revenue vs Commissions (line chart, last 12 months)
- Commission breakdown by type (pie chart)
- Top earners (bar chart)

**Payout Requests Table**:

- Requester Name & Role
- Amount
- Payment Method
- Requested Date
- Status
- Actions (Approve, Reject, View Details)

**Payout Request Detail Modal**:

- User information
- Total commissions breakdown (list of all included commissions)
- Payment method details
- Admin notes field
- Approve/Reject buttons (triggers status update & email notification)
- If approved: record payment details, update commission statuses to PAID

---

### 5.8 User Management (Admin)

**Users Page Table**:

- Profile Picture (thumbnail)
- Name
- Email
- Phone Number
- Role (badge)
- Status (Active/Suspended badge)
- Referred By (for customers/affiliates)
- Manager (for affiliates)
- Join Date
- Actions (Edit, Suspend/Activate, Delete, View Details)

**Filters**:

- Role
- Status
- Manager (for affiliates)
- Date range

**Add User Modal**:

- Role selection
- Basic info form (adjusted based on role)
- For affiliates: manager assignment dropdown
- For customers: optional referral code

**Edit User Modal**:

- Update all profile fields
- Change role (with confirmation)
- Suspend/activate account
- Reset password
- View activity history

**User Detail Page**:

- Complete profile information
- Activity logs
- Commission history (for managers/affiliates)
- Orders (for customers)
- Subscriptions (for customers)
- Team members (for managers)
- Referrals (for affiliates/managers)

---

### 5.9 System Settings (Admin Only)

**Settings Categories (Tabbed Interface)**:

#### 5.9.1 General Settings

- Platform Name
- Platform Logo (upload)
- Favicon (upload)
- Meta Description
- Contact Email
- Support Phone Number
- Platform Timezone
- Currency Settings

#### 5.9.2 SMTP Configuration

- SMTP Host
- SMTP Port
- SMTP Username
- SMTP Password
- Sender Email
- Sender Name
- Test Email Button (sends test email)

#### 5.9.3 Payment Gateway Settings

- Paystack:
  - Public Key
  - Secret Key
  - Webhook URL (auto-generated)
  - Test Mode Toggle
- Coming Soon Placeholders:
  - Stripe (disabled)
  - Flutterwave (disabled)

#### 5.9.4 Commission Settings

- Affiliate Signup Bonus (GHS)
- Manager Signup Bonus (GHS) - for direct signups only
- Affiliate Subscription Commission (GHS)
- Manager Subscription Percentage (default: 20%)
- Manager Product Percentage (default: 20%)
- Minimum Payout Amount (GHS)

#### 5.9.5 Email Templates

- List of system emails:
  - Welcome Email (for each role)
  - Subscription Confirmation
  - Subscription Expiry Reminder
  - Order Confirmation
  - Order Status Update
  - Commission Earned
  - Payout Request Submitted
  - Payout Approved/Rejected
- Each template has:
  - Subject line field
  - Rich text editor with template variables
  - Preview button
  - Send test email button

**Template Variables**:

```
{{user_name}}, {{user_email}}, {{platform_name}},
{{order_number}}, {{product_name}}, {{amount}},
{{commission_amount}}, {{subscription_plan}}, etc.
```

#### 5.9.6 Subscription Plans

- Create/Edit subscription plans:
  - Plan Name
  - Description
  - Price (GHS)
  - Duration (days)
  - Features (list)
  - Active status

---

## 6. UI/UX Design Guidelines

### 6.1 Design Principles

- **Minimal & Playful**: Clean interfaces with subtle playful elements (micro-interactions, smooth transitions)
- **Soft Round Edges**: border-radius: 12px for cards, 8px for buttons, 6px for inputs
- **Thin Icons**: Use Lucide React icons with strokeWidth={1.5}
- **No Emojis**: Replace with appropriate icons
- **WCAG Compliance**: Minimum AA standard
  - Color contrast ratio 4.5:1 for normal text
  - Color contrast ratio 3:1 for large text
  - Keyboard navigation support
  - ARIA labels and semantic HTML

### 6.2 Layout Structure

#### Sidebar Navigation (Like Claude)

- Width: 240px (desktop), collapsible on tablet
- Background: White (light mode) / Dark gray (dark mode)
- Logo at top (clickable to dashboard)
- Navigation items:
  - Icon (thin, 20px)
  - Label
  - Active state: subtle background color, border-left accent
- User profile section at bottom with dropdown
- Responsive: Bottom navigation bar on mobile

#### Top Bar

- Height: 64px
- Breadcrumbs (left)
- Search bar (center, if applicable)
- Notifications icon, user avatar (right)

#### Content Area

- Max width: 1280px
- Padding: 24px (desktop), 16px (mobile)
- Background: Light gray (#F9FAFB)

### 6.3 Component Styling

**Cards**:

```
background: white
border-radius: 12px
box-shadow: 0 1px 3px rgba(0,0,0,0.1)
padding: 24px
```

**Buttons**:

- Primary: Blue background, white text, border-radius 8px
- Secondary: White background, gray border, gray text
- Destructive: Red background, white text
- Height: 40px (default), 36px (small)
- Hover states with smooth transition

**Form Inputs**:

- Border: 1px solid gray-300
- Border-radius: 6px
- Height: 40px
- Focus: border-color change + subtle shadow
- Error state: red border

**Tables**:

- Zebra striping on rows
- Hover state on rows
- Sticky header
- Responsive: horizontal scroll on mobile with sticky first column
- Action buttons: icon buttons with tooltips

**Modal/Dialogs**:

- Backdrop: semi-transparent dark overlay
- Content: white card, centered, max-width 600px
- Border-radius: 16px
- Close button (X icon) top-right

### 6.4 Color Palette (Example)

**Light Mode**:

- Primary: #3B82F6 (blue)
- Secondary: #6B7280 (gray)
- Success: #10B981 (green)
- Warning: #F59E0B (amber)
- Error: #EF4444 (red)
- Background: #F9FAFB
- Surface: #FFFFFF
- Text Primary: #111827
- Text Secondary: #6B7280

**Dark Mode** (optional future enhancement):

- Invert backgrounds, adjust text colors for contrast

### 6.5 Responsive Breakpoints

```
Mobile: < 640px
Tablet: 640px - 1024px
Desktop: > 1024px
```

**Mobile Adjustments**:

- Sidebar becomes bottom navigation or hamburger menu
- Tables scroll horizontally or convert to cards
- Forms stack vertically
- Reduced padding/margins
- Larger touch targets (min 44x44px)

---

## 7. Payment Integration - Paystack

### 7.1 Subscription Payments

1. User selects subscription plan
2. Frontend calls backend API to initialize transaction
3. Backend creates transaction record with Paystack API
4. Frontend redirects to Paystack checkout (popup or redirect)
5. After payment, Paystack redirects to callback URL
6. Backend webhook receives payment confirmation
7. Backend creates/updates subscription record
8. Backend calculates and creates commission records
9. Backend sends confirmation email
10. Frontend shows success message

### 7.2 Product Order Payments

- Similar flow to subscriptions
- Include product details and customization data in transaction metadata
- On successful payment, create order record
- Trigger commission calculation
- Send order confirmation email

### 7.3 Webhook Handling

- Endpoint: `/api/webhooks/paystack`
- Verify webhook signature
- Handle events:
  - `charge.success`: Payment successful
  - `subscription.create`: Subscription created
  - `subscription.disable`: Subscription cancelled
- Update database accordingly
- Log all webhook events for debugging

### 7.4 Security

- Store API keys in environment variables
- Validate webhook signatures
- Use HTTPS for all payment-related requests
- Implement idempotency for webhook handlers
- Log all payment transactions

---

## 8. Email System

### 8.1 Email Types

1. **Authentication**: Welcome, password reset, email verification
2. **Transactions**: Order confirmation, payment receipt
3. **Notifications**: Commission earned, payout status, subscription expiry
4. **Marketing** (optional): Newsletter, promotions

### 8.2 Email Template System

- Store templates in database with variables
- Use Handlebars or similar templating engine
- Render templates server-side before sending
- Support plain text fallback
- Include unsubscribe link (for marketing emails)

### 8.3 Email Queue (Optional Enhancement)

- Use job queue (Bull, BullMQ) for asynchronous sending
- Retry failed emails
- Track email delivery status
- Rate limiting to avoid SMTP throttling

---

## 9. Activity Logging

### 9.1 Logged Actions

- User authentication (login, logout, failed attempts)
- User management (create, update, delete, suspend)
- Financial transactions (orders, commissions, payouts)
- Content management (flipbooks, products)
- System settings changes
- Invitation sends

### 9.2 Log Structure

```json
{
  "user_id": "uuid",
  "action_type": "ORDER_CREATED",
  "action_details": {
    "order_id": "uuid",
    "product_id": "uuid",
    "amount": 100
  },
  "ip_address": "1.2.3.4",
  "user_agent": "Mozilla/5.0...",
  "timestamp": "2024-01-09T12:00:00Z"
}
```

### 9.3 Activity Feed Display

- Recent activity widget on dashboard
- Filterable activity log page (admin)
- Real-time updates using WebSocket (optional)

---

## 10. Additional Essential Pages

### 10.1 Analytics & Reports (Admin)

- Custom date range selector
- Exportable reports (CSV, PDF)
- Metrics:
  - User growth over time
  - Revenue breakdown (subscriptions vs products)
  - Conversion funnel (signups → subscribers → purchasers)
  - Top products
  - Geographic distribution (if tracked)
  - Affiliate performance rankings
  - Customer lifetime value

### 10.2 Notifications Center

- Bell icon in top bar with unread count
- Dropdown list of recent notifications
- Categories:
  - System alerts (for admin)
  - Commission earnings (for affiliates/managers)
  - Order updates (for customers)
  - Payout status (for affiliates/managers)
- Mark as read functionality
- Link to full notifications page

### 10.3 Help & Support

- FAQ page (categorized)
- Contact form
- Live chat widget (optional, integrate Intercom/Crisp)
- Knowledge base/documentation
- Video tutorials (embedded YouTube)

### 10.4 Legal Pages

- Terms of Service
- Privacy Policy
- Refund Policy
- Cookie Policy
- Editable by admin in system settings

### 10.6 Profile Settings (All Users)

- Personal information
- Change password
- Two-factor authentication (optional security enhancement)
- Email notification preferences
- Connected accounts (social logins, future)
- Delete account option

### 10.7 Team Management (Managers)

- List of supervised affiliates
- Individual affiliate performance view
- Send message to affiliate (email or in-app)
- Export team performance report

### 10.8 Referral Dashboard (Affiliates)

- Visual representation of referral tree
- Referral link/QR code management:
  - Generate multiple links (campaign tracking)
  - Custom link slugs
  - QR code download
- Sharing tools (social media, WhatsApp
