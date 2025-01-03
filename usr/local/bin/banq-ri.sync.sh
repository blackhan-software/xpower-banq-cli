#!/usr/bin/env bash
#
# Simple Rate Index Sync Script
# Usage: banq-ri.sync.sh /srv/db/ri_apow_borrow_0.db > /tmp/ri_apow_borrow_0.log
#
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <database-path>" >&2
  echo "Example: $0 /srv/db/ri_apow_borrow_0.db > /tmp/ri_apow_borrow_0.log" >&2
  exit 1
fi

DB_PATH="$1"
DB_NAME="$(basename "$DB_PATH" .db)"

# Parse database name: ri_apow_borrow_0 -> token=APOW, mode=borrow, pool=P000
if [[ ! "$DB_NAME" =~ ^ri_([a-z]+)_(supply|borrow)_([0-9]+)$ ]]; then
  echo "Error: Invalid database name format: $DB_NAME" >&2
  echo "Expected format: ri_{token}_{supply|borrow}_{pool_num}" >&2
  exit 1
fi

TOKEN="${BASH_REMATCH[1]^^}"  # Convert to uppercase (apow -> APOW)
MODE="${BASH_REMATCH[2]}"
POOL_NUM="${BASH_REMATCH[3]}"
POOL="P$(printf '%03d' "$POOL_NUM")"

# Determine project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Default: scan last 365 chunks of 86400 blocks (~1 year)
BLOCKS="${BLOCKS:-86400}"
CHUNKS="${CHUNKS:-365}"

# Run banq ri for each chunk
for ((i=0; i<CHUNKS; i++)); do
  CHUNK_PADDED=$(printf '%03d' "$i")
  echo "[chunk $CHUNK_PADDED/$CHUNKS] INFO: Scanning blocks for $TOKEN $MODE (pool $POOL)..." >&2
  # Capture output, exit on failure after printing error
  if OUTPUT=$(banq ri "$TOKEN" --mode="$MODE" -p "$POOL" -YP --watch="${BLOCKS}@${i}" 2>&1); then
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
