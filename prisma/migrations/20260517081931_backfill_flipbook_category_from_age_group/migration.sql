-- Backfill categoryId for any flipbook whose ageGroup is set but categoryId is null.
UPDATE flipbooks SET category_id = (SELECT id FROM categories WHERE slug = 'little-lofters-0-3-years')
WHERE age_group = 'LITTLE_LOFTERS' AND category_id IS NULL;

UPDATE flipbooks SET category_id = (SELECT id FROM categories WHERE slug = 'loft-365-readers-ages-4-7')
WHERE age_group = 'LOFT_365' AND category_id IS NULL;

UPDATE flipbooks SET category_id = (SELECT id FROM categories WHERE slug = 'big-readers-ages-8-plus')
WHERE age_group = 'BIG_READERS' AND category_id IS NULL;

UPDATE flipbooks SET category_id = (SELECT id FROM categories WHERE slug = 'all-ages')
WHERE (age_group IS NULL OR age_group = '' OR LOWER(TRIM(age_group)) IN ('all', 'all ages', 'all age groups'))
  AND category_id IS NULL;
