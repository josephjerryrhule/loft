# 2026-05-11 — Flipbook age-group normalization & Bookshelf fix

Summary
- Normalize flipbook ageGroup handling so variants like "All Ages", "all age groups", and empty values are treated as "all". Queries now match case-insensitively (contains "all") so published flipbooks for "All Ages" show up on child dashboards.
- Remove `category` from product/flipbook validation (no longer used for grouping/shelves).
- Fix Bookshelf JSX parse error and layout issues so the child dashboard renders correctly.

Files changed
- src/app/actions/flipbooks.ts
- src/app/actions/child-flipbooks.ts
- src/components/child/Bookshelf.tsx
- src/lib/validations.ts
- plus related UI pages and tests

Notes
- If you want to fully drop the `category` column from the database, a Prisma migration is required; I didn't run a migration in this change.
- Recommend verifying: create a flipbook with age group values like "All Ages" and confirm it appears on child dashboard. Also test admin-assigned plans and published flipbook visibility.
