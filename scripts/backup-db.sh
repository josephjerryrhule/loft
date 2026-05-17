#!/usr/bin/env bash
# Full Postgres dump via pg_dump.
# Requires postgresql-client locally:
#   macOS:  brew install libpq && brew link --force libpq
#   Linux:  sudo apt-get install postgresql-client
#
# Usage:
#   scripts/backup-db.sh                   # uses DIRECT_URL or DATABASE_URL from .env
#   scripts/backup-db.sh /custom/path.sql  # custom output file
#
# Supabase note: prefer DIRECT_URL (port 5432) over the pooler URL (port 6543).
# pgbouncer in transaction mode doesn't support all pg_dump operations.

set -euo pipefail

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump not installed. Install postgresql-client first." >&2
  echo "  macOS: brew install libpq && brew link --force libpq" >&2
  echo "  Linux: sudo apt-get install postgresql-client" >&2
  exit 1
fi

# Load env
if [ -f .env ]; then
  set -a; source .env; set +a
fi

URL="${DIRECT_URL:-${DATABASE_URL:-}}"
if [ -z "$URL" ]; then
  echo "Neither DIRECT_URL nor DATABASE_URL is set in .env" >&2
  exit 1
fi

# Strip query params (pg_dump rejects ?pgbouncer=true etc.)
CLEAN_URL="${URL%%\?*}"

# Default output path
OUT="${1:-backups/loft-$(date -u +%Y%m%dT%H%M%SZ).sql}"
mkdir -p "$(dirname "$OUT")"

echo "Dumping to: $OUT"
pg_dump "$CLEAN_URL" \
  --no-owner \
  --no-privileges \
  --no-comments \
  --format=plain \
  --file="$OUT"

bytes=$(wc -c < "$OUT" | tr -d ' ')
echo "Done. ${bytes} bytes."
echo "Restore later with:  psql \"\$DATABASE_URL\" < $OUT"
