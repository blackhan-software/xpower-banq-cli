#!/usr/bin/env bash
set -euo pipefail

DB_PATH="${1-/var/lib/banq/rt.db}"
DB_PAGE="${2:-256}" # batch size

# --- One-time init on a short-lived connection ---
sqlite3 "$DB_PATH" >/dev/null <<'SQL'
-- writer/reader friendliness
PRAGMA busy_timeout=4096;
-- inserts shall not block readers
PRAGMA journal_mode=WAL;
-- reduced fsync cost (for append-only logs)
PRAGMA synchronous=NORMAL;
--
-- Text of JSON logs
--
CREATE TABLE IF NOT EXISTS raw_logs (
  id TEXT NOT NULL PRIMARY KEY,
  json TEXT NOT NULL
);
--
-- View of JSON logs
--
CREATE VIEW IF NOT EXISTS rtw_view AS
  SELECT
    json_extract(json,'$.id') AS id,
    json_extract(json,'$.filter') AS filter,
    json_extract(json,'$.source_symbol') AS source_symbol,
    json_extract(json,'$.source_token') AS source_token,
    json_extract(json,'$.target_symbol') AS target_symbol,
    json_extract(json,'$.target_token') AS target_token,

    -- scales: keep raw strings (with 'n'), plus scaled numerics
    (REPLACE(json_extract(json,'$.quote_bid'),'n','')+0.0)/1e18 AS quote_bid_e18,
    json_extract(json,'$.quote_bid') AS quote_bid,
    (REPLACE(json_extract(json,'$.quote_ask'),'n','')+0.0)/1e18 AS quote_ask_e18,
    json_extract(json,'$.quote_ask') AS quote_ask,

    -- timestamp (ISO 8601)
    datetime(CAST(REPLACE(json_extract(json,'$.quote_time'),'n','') AS INTEGER),'unixepoch') AS quote_time_iso,
    json_extract(json,'$.quote_time') AS quote_time,

    -- nested log.*
    json_extract(json,'$.log._type') AS log_type,
    json_extract(json,'$.log.address') AS log_address,
    json_extract(json,'$.log.blockHash') AS log_block_hash,
    CAST(json_extract(json,'$.log.blockNumber') AS INTEGER) AS log_block_number,
    json_extract(json,'$.log.data') AS log_data,
    CAST(json_extract(json,'$.log.index') AS INTEGER) AS log_index,
    CAST(json_extract(json,'$.log.removed') AS INTEGER) AS log_removed,
    json_extract(json,'$.log.topics') AS log_topics_json,
    json_extract(json,'$.log.transactionHash') AS log_tx_hash,
    CAST(json_extract(json,'$.log.transactionIndex') AS INTEGER) AS log_tx_index,

    -- original payload
    json
  FROM raw_logs;
--
-- Indexes (faster queries by time/block):
--
CREATE INDEX IF NOT EXISTS idx_block_number
  ON raw_logs (CAST(json_extract(json,'$.log.blockNumber') AS INTEGER));
CREATE INDEX IF NOT EXISTS idx_quote_time
  ON raw_logs (CAST(REPLACE(json_extract(json,'$.quote_time'),'n','') AS INTEGER));
SQL

# --- Long-lived ingest connection over a dedicated FD (no stdout pipe) ---
exec 3> >(sqlite3 "$DB_PATH" >/dev/null 2>&1)

# ensure the ingest connection has the same pragmas
printf 'PRAGMA busy_timeout=4096; PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;\n' >&3

# batch ingest; short transactions keep readers unblocked
printf 'BEGIN;\n' >&3
n=0
while IFS= read -r line; do
  # escape single quotes for SQL literal
  esc=${line//\'/\'\'}
  # extract id from JSON using sqlite's json_extract
  # if sqlite exits or FD closes, break quietly
  printf "INSERT OR REPLACE INTO raw_logs(id, json) VALUES(" >&3 2>/dev/null || break
  printf "(SELECT json_extract('%s','$.id'))," "$esc" >&3 2>/dev/null || break
  printf "'%s');\n" "$esc" >&3 2>/dev/null || break
  n=$((n+1))
  if (( n % DB_PAGE == 0 )); then
    printf 'COMMIT; BEGIN;\n' >&3 2>/dev/null || break
  fi
done

# normal EOF: finish last page (ignore errors if sqlite already gone)
printf 'COMMIT;\n' >&3 2>/dev/null || true
exec 3>&-
