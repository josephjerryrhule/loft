-- Performance Optimization: Database Indexes
-- Run this SQL script on your PostgreSQL database to add indexes for frequently queried columns

-- User lookups by email (login, registration, password reset)
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);

-- Commission queries (dashboard, admin finance)
CREATE INDEX IF NOT EXISTS idx_commission_user_status ON "Commission"("userId", status);
CREATE INDEX IF NOT EXISTS idx_commission_status_created ON "Commission"(status, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_commission_user_created ON "Commission"("userId", "createdAt" DESC);

-- Order queries (customer orders, admin revenue)
CREATE INDEX IF NOT EXISTS idx_order_customer_status ON "Order"("customerId", status);
CREATE INDEX IF NOT EXISTS idx_order_payment_status ON "Order"("paymentStatus", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_order_created_at ON "Order"("createdAt" DESC);

-- Flipbook progress queries (customer reading history)
CREATE INDEX IF NOT EXISTS idx_flipbook_progress_user ON "FlipbookProgress"("userId", "flipbookId");
CREATE INDEX IF NOT EXISTS idx_flipbook_progress_user_updated ON "FlipbookProgress"("userId", "updatedAt" DESC);

-- Subscription queries (active plans, revenue)
CREATE INDEX IF NOT EXISTS idx_subscription_user_status ON "Subscription"("userId", status);
CREATE INDEX IF NOT EXISTS idx_subscription_status_created ON "Subscription"(status, "createdAt" DESC);

-- Activity log queries (user feed, admin logs)
CREATE INDEX IF NOT EXISTS idx_activity_user_created ON "ActivityLog"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON "ActivityLog"("createdAt" DESC);

-- Payout requests (pending payouts, history)
CREATE INDEX IF NOT EXISTS idx_payout_user_status ON "PayoutRequest"("userId", status);
CREATE INDEX IF NOT EXISTS idx_payout_status_created ON "PayoutRequest"(status, "createdAt" DESC);

-- Email verification tokens (registration, login)
CREATE INDEX IF NOT EXISTS idx_email_token_hash ON "EmailVerificationToken"("hashedToken");
CREATE INDEX IF NOT EXISTS idx_email_token_expires ON "EmailVerificationToken"("expiresAt");

-- Affiliate invitations (tracking, commission attribution)
CREATE INDEX IF NOT EXISTS idx_invitation_inviter_created ON "Invitation"("inviterId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_invitation_status ON "Invitation"(status);

-- Plan lookups (subscription creation)
CREATE INDEX IF NOT EXISTS idx_plan_active ON "Plan"("isActive");

-- Product lookups (store, orders)
CREATE INDEX IF NOT EXISTS idx_product_active ON "Product"("isActive");

-- Flipbook queries (library, access control)
CREATE INDEX IF NOT EXISTS idx_flipbook_created ON "Flipbook"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_flipbook_plan ON "Flipbook"("planId");

-- System settings (frequent lookups)
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON "SystemSettings"(key);

-- To verify indexes were created, run:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('User', 'Commission', 'Order', 'FlipbookProgress', 'Subscription', 'ActivityLog', 'PayoutRequest') ORDER BY tablename, indexname;
