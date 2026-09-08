#!/usr/bin/env bash
#
# Kulaya backup: MongoDB archive + R2 object copy, encrypted, retained.
#
# Usage:
#   DATABASE_URL='...' BACKUP_PASSPHRASE='...' ./backup.sh
#
# Inputs (env):
#   DATABASE_URL        Atlas connection string (required)
#   BACKUP_PASSPHRASE   encryption passphrase (required; family password manager)
#   BACKUP_DIR          root for dated archives (default: ./backups)
#   R2_MIRROR           optional rclone remote for the object copy,
#                       e.g. "backup:kulaya-mirror" (skipped when unset)
#
# Layout (retained snapshots — never a plain mirror that propagates deletes):
#   $BACKUP_DIR/daily/kulaya-YYYY-MM-DD.archive.gz.enc    (keep 14)
#   $BACKUP_DIR/weekly/kulaya-YYYY-MM-DD.archive.gz.enc   (keep 8, Saturdays)
#   $BACKUP_DIR/monthly/kulaya-YYYY-MM-DD.archive.gz.enc  (keep 12, 1st of month)
#
# Restore: openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_PASSPHRASE \
#            -in <file> | mongorestore --uri "$DATABASE_URL" --archive --gzip
set -euo pipefail

: "${DATABASE_URL:?set DATABASE_URL}"
: "${BACKUP_PASSPHRASE:?set BACKUP_PASSPHRASE}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
R2_MIRROR="${R2_MIRROR:-}"

command -v mongodump >/dev/null || { echo "mongodump not found" >&2; exit 1; }
command -v openssl >/dev/null || { echo "openssl not found" >&2; exit 1; }

DATE_UTC="$(date -u +%F)"
DOW="$(date -u +%u)"   # 6 = Saturday
DOM="$(date -u +%d)"   # 01 = first of month
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly" "$BACKUP_DIR/monthly"

echo "[backup] dumping MongoDB…"
mongodump --uri="$DATABASE_URL" --archive="$WORK/kulaya-$DATE_UTC.archive.gz" --gzip --quiet

echo "[backup] encrypting (AES-256-CBC, PBKDF2)…"
openssl enc -aes-256-cbc -pbkdf2 \
  -pass env:BACKUP_PASSPHRASE \
  -in "$WORK/kulaya-$DATE_UTC.archive.gz" \
  -out "$BACKUP_DIR/daily/kulaya-$DATE_UTC.archive.gz.enc"

if [ "$DOW" = "6" ]; then
  cp "$BACKUP_DIR/daily/kulaya-$DATE_UTC.archive.gz.enc" \
     "$BACKUP_DIR/weekly/kulaya-$DATE_UTC.archive.gz.enc"
  echo "[backup] weekly snapshot kept"
fi
if [ "$DOM" = "01" ]; then
  cp "$BACKUP_DIR/daily/kulaya-$DATE_UTC.archive.gz.enc" \
     "$BACKUP_DIR/monthly/kulaya-$DATE_UTC.archive.gz.enc"
  echo "[backup] monthly snapshot kept"
fi

prune() {
  # keep newest $2 files in $1
  local dir="$1" keep="$2" count
  count="$(ls -1 "$dir" 2>/dev/null | wc -l)"
  if [ "$count" -gt "$keep" ]; then
    ls -1t "$dir" | tail -n +"$((keep + 1))" | while IFS= read -r f; do
      rm -f "$dir/$f"
    done
  fi
}
prune "$BACKUP_DIR/daily" 14
prune "$BACKUP_DIR/weekly" 8
prune "$BACKUP_DIR/monthly" 12

if [ -n "$R2_MIRROR" ]; then
  command -v rclone >/dev/null || { echo "rclone not found, skipping object copy" >&2; exit 0; }
  # Additive copy (never --sync): deletes in primary must NOT propagate.
  echo "[backup] copying R2 objects (additive, no deletes)…"
  rclone copy --update r2:kulaya-photos/photos "$R2_MIRROR/photos"
  rclone copy --update r2:kulaya-photos/documents "$R2_MIRROR/documents"
fi

echo "[backup] done: $BACKUP_DIR/daily/kulaya-$DATE_UTC.archive.gz.enc"
