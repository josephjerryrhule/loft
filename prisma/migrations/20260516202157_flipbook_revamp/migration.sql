-- CreateEnum
CREATE TYPE "FlipbookSource" AS ENUM ('HEYZINE', 'SELF_HOSTED');

-- AlterTable
ALTER TABLE "flipbook_progress" ADD COLUMN     "child_profile_id" TEXT;

-- AlterTable
ALTER TABLE "flipbooks" ADD COLUMN     "age_group" TEXT,
ADD COLUMN     "category_id" TEXT,
ADD COLUMN     "heyzine_url" TEXT,
ADD COLUMN     "iframe_content" TEXT,
ADD COLUMN     "optimized_pdf_url" TEXT,
ADD COLUMN     "pages_manifest" JSONB,
ADD COLUMN     "processing_started_at" TIMESTAMP(3),
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "source_type" "FlipbookSource" NOT NULL DEFAULT 'HEYZINE';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "completed_file_url" TEXT,
ADD COLUMN     "customer_upload_url" TEXT,
ADD COLUMN     "shipping_address" TEXT,
ADD COLUMN     "shipping_city" TEXT,
ADD COLUMN     "shipping_country" TEXT,
ADD COLUMN     "shipping_postal_code" TEXT,
ADD COLUMN     "shipping_state" TEXT;

-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "affiliate_commission_percentage" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "child_profile_id" TEXT,
ADD COLUMN     "currency" TEXT DEFAULT 'GHS',
ADD COLUMN     "gateway" TEXT DEFAULT 'PAYSTACK',
ADD COLUMN     "payment_reference" TEXT,
ADD COLUMN     "payment_status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" TEXT,
ADD COLUMN     "ambassador_expiry" TIMESTAMP(3),
ADD COLUMN     "ambassador_id" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "require_password_reset" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "team_leader_id" TEXT;

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_profiles" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age_group" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "avatar_color" TEXT NOT NULL DEFAULT '#6366f1',
    "date_of_birth" TIMESTAMP(3),
    "username" TEXT,
    "reading_streak" INTEGER NOT NULL DEFAULT 0,
    "last_reading_date" TIMESTAMP(3),
    "badges" JSONB DEFAULT '[]',

    CONSTRAINT "child_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_login_tokens" (
    "id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "child_login_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_display_order_idx" ON "categories"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "child_profiles_username_key" ON "child_profiles"("username");

-- CreateIndex
CREATE INDEX "child_profiles_parent_id_idx" ON "child_profiles"("parent_id");

-- CreateIndex
CREATE INDEX "child_profiles_age_group_idx" ON "child_profiles"("age_group");

-- CreateIndex
CREATE INDEX "child_login_tokens_child_id_idx" ON "child_login_tokens"("child_id");

-- CreateIndex
CREATE UNIQUE INDEX "flipbook_progress_child_profile_id_flipbook_id_key" ON "flipbook_progress"("child_profile_id", "flipbook_id");

-- CreateIndex
CREATE INDEX "flipbooks_published_at_idx" ON "flipbooks"("published_at");

-- CreateIndex
CREATE INDEX "flipbooks_category_id_idx" ON "flipbooks"("category_id");

-- CreateIndex
CREATE INDEX "flipbooks_source_type_idx" ON "flipbooks"("source_type");

-- CreateIndex
CREATE INDEX "subscriptions_child_profile_id_idx" ON "subscriptions"("child_profile_id");

-- CreateIndex
CREATE INDEX "subscriptions_payment_status_idx" ON "subscriptions"("payment_status");

-- CreateIndex
CREATE UNIQUE INDEX "users_ambassador_id_key" ON "users"("ambassador_id");

-- CreateIndex
CREATE INDEX "users_ambassador_id_idx" ON "users"("ambassador_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_team_leader_id_fkey" FOREIGN KEY ("team_leader_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "child_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flipbooks" ADD CONSTRAINT "flipbooks_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flipbook_progress" ADD CONSTRAINT "flipbook_progress_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "child_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_login_tokens" ADD CONSTRAINT "child_login_tokens_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default categories (idempotent)
INSERT INTO categories (id, name, slug, display_order, created_at)
VALUES
  (gen_random_uuid(), 'Sci-Fi',       'sci-fi',       10, NOW()),
  (gen_random_uuid(), 'Fantasy',      'fantasy',      20, NOW()),
  (gen_random_uuid(), 'Drama',        'drama',        30, NOW()),
  (gen_random_uuid(), 'Business',     'business',     40, NOW()),
  (gen_random_uuid(), 'Education',    'education',    50, NOW()),
  (gen_random_uuid(), 'Geography',    'geography',    60, NOW()),
  (gen_random_uuid(), 'Adventure',    'adventure',    70, NOW()),
  (gen_random_uuid(), 'Mystery',      'mystery',      80, NOW()),
  (gen_random_uuid(), 'Picture Book', 'picture-book', 90, NOW())
ON CONFLICT (slug) DO NOTHING;

-- Backfill source_type for existing rows
UPDATE flipbooks
SET source_type = 'SELF_HOSTED'
WHERE pdf_url IS NOT NULL
  AND iframe_content IS NULL
  AND heyzine_url IS NULL;
