#!/usr/bin/env bash
#
# Simple Rate Tracker Sync Script
# Usage: banq-rt.sync.sh /srv/db/rt_apow_xpow_0.db > /tmp/rt_apow_xpow_0.log
#
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <database-path>" >&2
  echo "Example: $0 /srv/db/rt_apow_xpow_0.db > /tmp/rt_apow_xpow_0.log" >&2
  exit 1
fi

DB_PATH="$1"
DB_NAME="$(basename "$DB_PATH" .db)"

# Parse database name: rt_apow_xpow_0 -> source=APOW, target=XPOW, oracle=T000
if [[ ! "$DB_NAME" =~ ^rt_([a-z]+)_([a-z]+)_([0-9]+)$ ]]; then
  echo "Error: Invalid database name format: $DB_NAME" >&2
  echo "Expected format: rt_{source}_{target}_{oracle_num}" >&2
  exit 1
fi

SOURCE="${BASH_REMATCH[1]^^}"  # Convert to uppercase (apow -> APOW)
TARGET="${BASH_REMATCH[2]^^}"  # Convert to uppercase (xpow -> XPOW)
ORACLE_NUM="${BASH_REMATCH[3]}"
ORACLE="T$(printf '%03d' "$ORACLE_NUM")"

# Determine project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Default: scan last 365 chunks of 86400 blocks (~1 year)
BLOCKS="${BLOCKS:-86400}"
CHUNKS="${CHUNKS:-365}"

# Run banq rt for each chunk
for ((i=0; i<CHUNKS; i++)); do
  CHUNK_PADDED=$(printf '%03d' "$i")
  echo "[chunk $CHUNK_PADDED/$CHUNKS] INFO: Scanning blocks for $SOURCE/$TARGET (oracle $ORACLE)..." >&2
  # Capture output, exit on failure after printing error
  if OUTPUT=$(banq rt "$SOURCE" "$TARGET" -o "$ORACLE" -YP --watch="${BLOCKS}@${i}" 2>&1); then
    FILTERED=$(echo "$OUTPUT" | grep '^{.*}$' || true) # filter JSON lines
    LINE_COUNT=$(echo "$FILTERED" | grep -c '^' || echo 0)
    if [[ -n "$FILTERED" ]]; then
      echo "$FILTERED"
    fi
    echo "[chunk $CHUNK_PADDED/$CHUNKS] INFO: Found $LINE_COUNT log entries" >&2
  else
    EXIT_CODE=$?
    echo "[chunk $CHUNK_PADDED/$CHUNKS] ERROR: Command failed (exit code $EXIT_CODE)" >&2
    echo "$OUTPUT" >&2
    exit $EXIT_CODE
  fi
done
