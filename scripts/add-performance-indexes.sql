-- Performance Optimization: Database Indexes
-- Run this SQL script on your PostgreSQL database to add indexes for frequently queried columns

-- User lookups by email (login, registration, password reset)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Commission queries (dashboard, admin finance)
CREATE INDEX IF NOT EXISTS idx_commissions_user_status ON commissions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_status_created ON commissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commissions_user_created ON commissions(user_id, created_at DESC);

-- Order queries (customer orders, admin revenue)
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Flipbook progress queries (customer reading history)
CREATE INDEX IF NOT EXISTS idx_flipbook_progress_user ON flipbook_progress(user_id, flipbook_id);
CREATE INDEX IF NOT EXISTS idx_flipbook_progress_user_updated ON flipbook_progress(user_id, updated_at DESC);

-- Subscription queries (active plans, revenue)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_created ON subscriptions(status, created_at DESC);

-- Activity log queries (user feed, admin logs)
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Payout requests (pending payouts, history)
CREATE INDEX IF NOT EXISTS idx_payout_requests_user_status ON payout_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status_created ON payout_requests(status, created_at DESC);

-- Email verification tokens (registration, login)
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_hash ON email_verification_tokens(hashed_token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires ON email_verification_tokens(expires_at);

-- Affiliate invitations (tracking, commission attribution)
CREATE INDEX IF NOT EXISTS idx_invitations_inviter_created ON invitations(inviter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- Plan lookups (subscription creation)
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

-- Product lookups (store, orders)
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Flipbook queries (library, access control)
CREATE INDEX IF NOT EXISTS idx_flipbooks_created ON flipbooks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flipbooks_plan ON flipbooks(plan_id);

-- System settings (frequent lookups)
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- To verify indexes were created, run:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('users', 'commissions', 'orders', 'flipbook_progress', 'subscriptions', 'activity_logs', 'payout_requests') ORDER BY tablename, indexname;
