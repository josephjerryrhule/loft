-- Add performance indexes for better query speed
-- Run this migration when database is accessible

-- User indexes
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users"("status");
CREATE INDEX IF NOT EXISTS "users_manager_id_idx" ON "users"("manager_id");
CREATE INDEX IF NOT EXISTS "users_referred_by_id_idx" ON "users"("referred_by_id");
CREATE INDEX IF NOT EXISTS "users_invite_code_idx" ON "users"("invite_code");
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users"("created_at");

-- Subscription indexes
CREATE INDEX IF NOT EXISTS "subscriptions_customer_id_idx" ON "subscriptions"("customer_id");
CREATE INDEX IF NOT EXISTS "subscriptions_plan_id_idx" ON "subscriptions"("plan_id");
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions"("status");
CREATE INDEX IF NOT EXISTS "subscriptions_start_date_idx" ON "subscriptions"("start_date");
CREATE INDEX IF NOT EXISTS "subscriptions_end_date_idx" ON "subscriptions"("end_date");
CREATE INDEX IF NOT EXISTS "subscriptions_created_at_idx" ON "subscriptions"("created_at");

-- Order indexes
CREATE INDEX IF NOT EXISTS "orders_customer_id_idx" ON "orders"("customer_id");
CREATE INDEX IF NOT EXISTS "orders_product_id_idx" ON "orders"("product_id");
CREATE INDEX IF NOT EXISTS "orders_referred_by_id_idx" ON "orders"("referred_by_id");
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders"("status");
CREATE INDEX IF NOT EXISTS "orders_payment_status_idx" ON "orders"("payment_status");
CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders"("created_at");

-- Commission indexes
CREATE INDEX IF NOT EXISTS "commissions_user_id_idx" ON "commissions"("user_id");
CREATE INDEX IF NOT EXISTS "commissions_status_idx" ON "commissions"("status");
CREATE INDEX IF NOT EXISTS "commissions_source_type_idx" ON "commissions"("source_type");
CREATE INDEX IF NOT EXISTS "commissions_created_at_idx" ON "commissions"("created_at");

-- Activity log indexes
CREATE INDEX IF NOT EXISTS "activity_logs_user_id_idx" ON "activity_logs"("user_id");
CREATE INDEX IF NOT EXISTS "activity_logs_action_type_idx" ON "activity_logs"("action_type");
CREATE INDEX IF NOT EXISTS "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- Flipbook indexes
CREATE INDEX IF NOT EXISTS "flipbooks_created_by_idx" ON "flipbooks"("created_by");
CREATE INDEX IF NOT EXISTS "flipbooks_category_idx" ON "flipbooks"("category");
CREATE INDEX IF NOT EXISTS "flipbooks_is_published_idx" ON "flipbooks"("is_published");
CREATE INDEX IF NOT EXISTS "flipbooks_is_free_idx" ON "flipbooks"("is_free");
CREATE INDEX IF NOT EXISTS "flipbooks_created_at_idx" ON "flipbooks"("created_at");
