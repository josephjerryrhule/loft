-- Replace seeded "genre" categories with age-group categories.
-- Only deletes seeded slugs that aren't currently referenced by any flipbook,
-- so re-applying or running against prod is safe.

DELETE FROM categories
WHERE slug IN (
  'sci-fi', 'fantasy', 'drama', 'business', 'education',
  'geography', 'adventure', 'mystery', 'picture-book'
)
AND NOT EXISTS (
  SELECT 1 FROM flipbooks f WHERE f.category_id = categories.id
);

-- Seed the four age-group categories (idempotent via ON CONFLICT).
INSERT INTO categories (id, name, slug, display_order, created_at)
VALUES
  (gen_random_uuid(), 'All Ages (Default)',          'all-ages',                 10, NOW()),
  (gen_random_uuid(), 'Little lofters - 0-3 years',  'little-lofters-0-3-years', 20, NOW()),
  (gen_random_uuid(), 'Loft 365 readers - ages 4-7', 'loft-365-readers-ages-4-7',30, NOW()),
  (gen_random_uuid(), 'Big readers - ages 8+',       'big-readers-ages-8-plus',  40, NOW())
ON CONFLICT (slug) DO NOTHING;
