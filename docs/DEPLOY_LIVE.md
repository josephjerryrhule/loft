# Live Deploy Checklist (Plesk)

Use this whenever you push `main` to the production Plesk host. The steps assume the live database is the one wired into your live `.env` (NOT the staging Supabase URL on your dev `.env`).

---

## 1. Pre-flight on local

```bash
# Ensure you're on the branch you intend to ship
git status
git log --oneline -5

# Type-check + tests + lint
npx tsc --noEmit -p tsconfig.json
npm test
npm run lint   # pre-existing warnings are OK; new errors are not

# Confirm working tree is clean
git status --porcelain    # should be empty
```

## 2. Back up the live DB

**Always back up before any migration push.** Two options:

```bash
# Preferred: full SQL dump (requires libpq)
brew install libpq && brew link --force libpq   # one-time on macOS
scripts/backup-db.sh                            # writes backups/loft-<ts>.sql
```

```bash
# Fallback: Prisma JSON dump (no extra deps)
node scripts/backup-db.mjs                       # writes backups/loft-<ts>.json
```

Both honor `DIRECT_URL` (preferred) or `DATABASE_URL` from `.env`. For Supabase, point at the **direct** connection (port `5432`), not the pgbouncer pooler (`6543`), since pooler in transaction mode rejects some `pg_dump` operations.

Keep the dump somewhere off the Plesk box (drop it in iCloud / Dropbox / wherever).

## 3. Push code

```bash
git push origin main
```

Plesk auto-deploys via Git hook (or pull manually if no hook). Confirm via Plesk control panel that the latest commit is what just landed.

## 4. Apply database migrations on live

SSH into Plesk (or run via Plesk's Node-app shell), then:

```bash
cd /var/www/vhosts/<your-domain>/<app-path>   # adjust to your Plesk app dir
npm ci                                         # installs sharp, pdf-to-img, howler, etc.
npx prisma migrate deploy                      # applies every pending migration in order
npx prisma generate                            # regenerate client against the new schema
```

**If the live DB has never tracked migrations** (was built via `db push`), baseline the pre-existing migration first, then deploy:

```bash
npx prisma migrate resolve --applied 20260110035114_add_performance_indexes
npx prisma migrate deploy
```

Verify:

```bash
npx prisma migrate status                      # should report "Database schema is up to date!"
```

## 5. Seed the categories on live (one-time)

The migration `20260516202157_flipbook_revamp` seeds 9 genre categories. The follow-up `20260517081537_seed_age_group_categories` replaces them with the 4 age-group categories. The follow-up `20260517081931_backfill_flipbook_category_from_age_group` links any existing flipbooks to the right category.

All three run automatically as part of `migrate deploy`. No manual seed needed.

If you want to verify:

```bash
echo "SELECT name, slug, display_order FROM categories ORDER BY display_order;" | npx prisma db execute --stdin
```

Expected output:
```
All Ages (Default)              all-ages                   10
Little lofters - 0-3 years      little-lofters-0-3-years   20
Loft 365 readers - ages 4-7     loft-365-readers-ages-4-7  30
Big readers - ages 8+           big-readers-ages-8-plus    40
```

## 6. Restart the Node app

Via Plesk: **Node.js → Restart App**. Or from shell:

```bash
touch tmp/restart.txt    # if using Passenger
# OR
pm2 restart loft          # if managed by pm2
```

## 7. Verify upload directory env

Confirm `UPLOAD_DIR_BASE` in live `.env` points to a writable, web-served path under your Plesk vhost. Example:

```env
UPLOAD_DIR_BASE=/var/www/vhosts/loft.example/httpdocs/uploads
```

The Next app writes flipbook assets to `${UPLOAD_DIR_BASE}/flipbooks/<id>/page-001.webp` and exposes them at `/uploads/flipbooks/<id>/page-001.webp`.

Ownership: the directory must be writable by the Node process user (commonly the Plesk `psaadm` group or the vhost user).

```bash
mkdir -p $UPLOAD_DIR_BASE/flipbooks
chown -R <vhost-user>:<vhost-group> $UPLOAD_DIR_BASE
chmod -R 775 $UPLOAD_DIR_BASE
```

## 8. Smoke test on live

1. Visit `https://<your-domain>/admin/flipbooks` as an admin → category pills + grid render
2. Click **New Flipbook → Heyzine** → paste a known-good Heyzine URL → publish → row appears
3. Click **New Flipbook → PDF Upload** → drop a ≤ 50 MB PDF → wait 10–60s → row appears, cover shows first page
4. Open the new flipbook → pages flip, sound plays, mute toggle works
5. Hover a self-hosted card → click **Re-render** → toast "Re-render complete"
6. Visit `/settings → System Admin → Categories` → add/rename/reorder/delete works

## 9. Rollback plan

If something is broken:

```bash
# Code rollback
git revert <bad-commit> && git push origin main

# Schema rollback (manual — Prisma has no built-in down-migration)
psql "$DATABASE_URL" < backups/loft-<ts>.sql
```

The pure-JS pipeline means there are no system-package side-effects to undo on the host.

---

## Things that can bite you

| Symptom | Cause | Fix |
|---|---|---|
| `Body exceeded 1 MB limit` on PDF upload | Next server-action body cap | Already raised to 60 MB in `next.config.ts`; confirm the deploy includes that file |
| `pdf-to-img` install fails on Plesk | Native canvas binary mismatch | `npm rebuild @napi-rs/canvas` then restart |
| Pages 404 after upload | `UPLOAD_DIR_BASE` not writable / wrong path | Re-check ownership + symlink the dir into `httpdocs/uploads` if needed |
| Category pills missing on live | Seed migrations didn't run | `npx prisma migrate deploy && npx prisma migrate status` |
| Heyzine iframe blank | CSP `frame-src` blocking heyzine.com | Already in `next.config.ts` CSP; clear browser cache + hard reload |
| Migration baseline drift | Live DB built via `db push`, never tracked migrations | `npx prisma migrate resolve --applied <first-migration>` then `migrate deploy` |

## Future deploys (after this first one)

Once the live DB is migration-tracked, every subsequent deploy is just:

```bash
git pull origin main && npm ci && npx prisma migrate deploy && npx prisma generate
# then restart the Node app
```

Always back up first (`scripts/backup-db.sh`).
