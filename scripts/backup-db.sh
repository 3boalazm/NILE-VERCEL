#!/usr/bin/env bash
#
# F-53 — database backup / verify / restore.
#
# There was no backup tooling at all: a single bad migration or a dropped
# table meant losing every product, order and customer, with no recovery path
# and nobody who had ever rehearsed one. This is that path, plus the rehearsal
# (`verify` proves an archive is readable without touching a live database).
#
# One database, two schemas' worth of data: Payload (CMS: products, categories,
# media, inquiries, users) and Vendure (commerce: orders, customers, stock)
# share a single Postgres instance — see DATABASE_URI in payload.config.ts and
# DB_* in vendure-config.ts. A single dump therefore covers both. If a
# deployment splits them across two databases, this script detects the
# difference and dumps each one separately.
#
# Usage:
#   scripts/backup-db.sh backup            # write a timestamped archive
#   scripts/backup-db.sh verify [file]     # prove the newest (or given) archive reads
#   scripts/backup-db.sh list              # show archives, sizes, checksums
#   scripts/backup-db.sh restore <file> [--yes]
#
# Cron (daily at 03:30, keeping 14 days — the retention prune runs inside
# `backup`, so a cron job cannot silently fill the disk):
#   30 3 * * * cd /srv/npf && BACKUP_RETENTION_DAYS=14 scripts/backup-db.sh backup >> /var/log/npf-backup.log 2>&1
#
# Deliberately NOT here: offsite replication. A backup on the same host as the
# database does not survive losing the host; copy BACKUP_DIR somewhere else
# (rclone/restic/S3) as a second step. Noted in docs/OPS.md rather than
# pretended away.

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-.backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

log()  { printf '%s\n' "$*"; }
die()  { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

need() {
  command -v "$1" >/dev/null 2>&1 || die "$1 not found on PATH. Install the PostgreSQL client tools (apt: postgresql-client, brew: libpq)."
}

# Load .env as DEFAULTS, never as overrides.
#
# Sourcing it the obvious way (`set -a; . ./.env`) silently replaced anything
# the caller had already exported — so `DATABASE_URI=…staging… backup-db.sh
# backup` from cron backed up the local database named in .env instead. An
# explicit environment must win; .env only fills gaps.
if [[ -f .env ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*(#|$) ]] && continue
    line="${line#export }"
    key="${line%%=*}"; key="${key//[[:space:]]/}"
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    # Already present in the environment (even if empty) -> caller wins.
    [[ -n "${!key+set}" ]] && continue
    value="${line#*=}"
    value="${value%$'\r'}"
    # Trim one level of matching quotes, as dotenv does.
    if [[ "$value" == \"*\" || "$value" == \'*\' ]]; then value="${value:1:${#value}-2}"; fi
    export "$key=$value"
  done < .env
fi

# ---------------------------------------------------------------- connections
# Payload and Vendure may point at the same database (the default here) or at
# two. Emit one label+URI pair per *distinct* target.
declare -A TARGETS=()

if [[ -n "${DATABASE_URI:-}" ]]; then
  TARGETS[payload]="$DATABASE_URI"
fi
if [[ -n "${DB_HOST:-}" && -n "${DB_NAME:-}" ]]; then
  TARGETS[vendure]="postgresql://${DB_USERNAME:-postgres}:${DB_PASSWORD:-}@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME}?options=--search_path%3D${DB_SCHEMA:-public}"
fi

[[ ${#TARGETS[@]} -gt 0 ]] || die "No database configured. Set DATABASE_URI (Payload) and/or DB_HOST/DB_NAME/DB_USERNAME/DB_PASSWORD (Vendure) — see .env.example."

# De-duplicate so one database is not dumped twice.
#
# Comparing the connection strings is NOT enough, and the first version of this
# script did exactly that: Payload's `DATABASE_URI` and Vendure's assembled
# `postgresql://user:pass@host:port/db?options=…` describe the *same* database
# in two different spellings (different credentials format, an added
# search_path option), so both were dumped. Identity is host:port/database —
# credentials and options do not change which bytes come out.
db_identity() {
  local uri="$1" rest hostport host port db
  rest="${uri#*://}"
  rest="${rest#*@}"              # drop any user:password@
  hostport="${rest%%/*}"
  db="${rest#*/}"; db="${db%%\?*}"  # drop ?options=…
  host="${hostport%%:*}"
  port="${hostport##*:}"
  [[ "$port" == "$hostport" ]] && port=5432
  printf '%s:%s/%s' "$host" "$port" "$db"
}

declare -A UNIQUE=()
declare -A IDENTITIES=()
for label in $(printf '%s\n' "${!TARGETS[@]}" | sort); do
  uri="${TARGETS[$label]}"
  identity="$(db_identity "$uri")"
  seen=""
  for existing in "${!IDENTITIES[@]}"; do
    [[ "${IDENTITIES[$existing]}" == "$identity" ]] && seen="$existing"
  done
  if [[ -z "$seen" ]]; then
    UNIQUE[$label]="$uri"
    IDENTITIES[$label]="$identity"
  else
    log "note: '$label' is the same database as '$seen' ($identity) — dumping it once."
  fi
done

# ---------------------------------------------------------------- commands
do_backup() {
  need pg_dump
  mkdir -p "$BACKUP_DIR"
  local wrote=0
  for label in $(printf '%s\n' "${!UNIQUE[@]}" | sort); do
    local uri="${UNIQUE[$label]}"
    local out="$BACKUP_DIR/npf-${label}-${STAMP}.dump"
    log "dumping '$label' -> $out"
    # --format=custom: compressed, selectively restorable, and `pg_restore
    # --list` can validate it without a database (that is what `verify` uses).
    # --no-owner/--no-privileges: restoring into a different role (a staging
    # database, a fresh container) must not fail on GRANT/OWNER statements.
    pg_dump --format=custom --compress=9 --no-owner --no-privileges --file="$out" "$uri" \
      || die "pg_dump failed for '$label'. Nothing was written to $out."
    [[ -s "$out" ]] || die "pg_dump produced an empty archive for '$label' — treating that as a failure, not a success."
    if command -v sha256sum >/dev/null 2>&1; then
      sha256sum "$out" | sed "s|$BACKUP_DIR/||" > "${out}.sha256"
    fi
    log "  $(du -h "$out" | cut -f1)  $( [[ -f ${out}.sha256 ]] && cut -d' ' -f1 "${out}.sha256" | cut -c1-16 )…"
    wrote=$((wrote + 1))
  done

  # Retention prune — per label, so keeping 14 days of two databases does not
  # evict one of them early.
  for label in $(printf '%s\n' "${!UNIQUE[@]}" | sort); do
    local removed=0
    while IFS= read -r old; do
      [[ -n "$old" ]] || continue
      rm -f "$old" "${old}.sha256"
      removed=$((removed + 1))
    done < <(find "$BACKUP_DIR" -name "npf-${label}-*.dump" -type f -mtime +"$BACKUP_RETENTION_DAYS" 2>/dev/null)
    [[ $removed -gt 0 ]] && log "pruned $removed archive(s) older than $BACKUP_RETENTION_DAYS day(s) for '$label'"
  done
  log "backup complete: $wrote archive(s) in $BACKUP_DIR"
  log "reminder: copy $BACKUP_DIR off this host — a backup on the database's own disk does not survive losing the disk."
}

do_verify() {
  need pg_restore
  local file="${1:-$(latest_archive)}"
  [[ -f "$file" ]] || die "no such archive: $file"
  # Reading the archive's table of contents proves it is a complete,
  # uncorrupted custom-format dump — no database connection required, so this
  # is safe to run in CI against a fixture and against production archives.
  pg_restore --list "$file" >/dev/null || die "archive is NOT readable: $file"
  if [[ -f "${file}.sha256" ]] && command -v sha256sum >/dev/null 2>&1; then
    ( cd "$(dirname "$file")" && sha256sum --check "$(basename "$file").sha256" >/dev/null ) \
      || die "checksum mismatch for $file — the archive changed since it was written."
    log "checksum OK"
  fi
  log "verified OK: $file ($(du -h "$file" | cut -f1), $(pg_restore --list "$file" | grep -c '^[0-9]' || true) entries)"
}

do_list() {
  [[ -d "$BACKUP_DIR" ]] || die "no backup directory yet ($BACKUP_DIR) — run: scripts/backup-db.sh backup"
  local found=0
  while IFS= read -r f; do
    [[ -n "$f" ]] || continue
    found=1
    printf '%s  %8s  %s\n' "$(date -u -r "$f" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || stat -c %y "$f")" "$(du -h "$f" | cut -f1)" "$f"
  done < <(find "$BACKUP_DIR" -name 'npf-*.dump' -type f | sort -r)
  [[ $found -eq 1 ]] || die "no archives in $BACKUP_DIR"
}

latest_archive() {
  local f
  f="$(find "$BACKUP_DIR" -name 'npf-*.dump' -type f 2>/dev/null | sort -r | head -1 || true)"
  [[ -n "$f" ]] || die "no archives in $BACKUP_DIR — run: scripts/backup-db.sh backup"
  printf '%s\n' "$f"
}

do_restore() {
  need pg_restore
  local file="${1:-}"
  [[ -n "$file" ]] || die "restore needs an archive: scripts/backup-db.sh restore <file> [--yes]"
  [[ -f "$file" ]] || die "no such archive: $file"

  # Restoring is destructive (--clean drops and recreates objects), so it is
  # never the default outcome of a typo: require an explicit --yes, or an
  # interactive confirmation when attached to a terminal.
  local confirmed="no"
  [[ "${2:-}" == "--yes" ]] && confirmed="yes"
  if [[ "$confirmed" != "yes" ]]; then
    [[ -t 0 ]] || die "refusing to restore without confirmation on a non-interactive shell. Re-run with --yes if that is really what you want."
    printf 'This will DROP and recreate objects in the target database from:\n  %s\n\nType "restore" to continue: ' "$file"
    read -r reply
    [[ "$reply" == "restore" ]] || die "aborted (typed: ${reply:-<nothing>})"
  fi

  do_verify "$file"
  for label in $(printf '%s\n' "${!UNIQUE[@]}" | sort); do
    log "restoring '$label' from $file"
    pg_restore --clean --if-exists --no-owner --no-privileges --exit-on-error \
      --dbname="${UNIQUE[$label]}" "$file" \
      || die "pg_restore failed for '$label'. The database may be partially restored — check the output above before retrying."
  done
  log "restore complete. Verify in the app (product list, an order, admin login) before declaring the incident closed."
}

case "${1:-}" in
  backup)  do_backup ;;
  verify)  do_verify "${2:-}" ;;
  list)    do_list ;;
  restore) shift; do_restore "$@" ;;
  ""|-h|--help|help)
    sed -n '2,32p' "$0" | sed 's/^# \{0,1\}//'
    ;;
  *) die "unknown command: $1 (try: backup | verify | list | restore | help)" ;;
esac
