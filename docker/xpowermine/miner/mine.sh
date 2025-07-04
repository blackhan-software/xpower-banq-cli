#!/bin/sh
#######################################################################
# Utility functions

iso_date() {
    date -u +%Y-%m-%dT%H:%M:%S.%3NZ
}

#######################################################################
# Kill previous processes (if any)

echo '{"step":"[kill|💀]","now":"'$(iso_date)'"}'
pkill -f '[b]anq xpow-init' 2>/dev/null || true
pkill -f '[b]anq xpow-mine' 2>/dev/null || true
pkill -f '[b]anq xpow-mint' 2>/dev/null || true

#######################################################################
# Load secrets

if [ -z "$MINT_ADDRESS" ]; then
    SECRET_PATH="/var/run/secrets/mint-address"
    if [ -f "$SECRET_PATH" ]; then
        export MINT_ADDRESS="$(cat "$SECRET_PATH")"
    else
        echo "MINT_ADDRESS missing"
        exit 1
    fi
fi

if [ -z "$MINT_ADDRESS_PK" ]; then
    SECRET_PATH="/var/run/secrets/mint-address-pk"
    if [ -f "$SECRET_PATH" ]; then
        export PRIVATE_KEY="$(cat "$SECRET_PATH")"
    else
        echo "MINT_ADDRESS_PK missing"
        exit 1
    fi
else
    export PRIVATE_KEY="$MINT_ADDRESS_PK"
fi

#######################################################################
# Defaults

export MAX_PRIORITY_FEE_PER_GAS="${MAX_PRIORITY_FEE_PER_GAS}"
export MAX_FEE_PER_GAS="${MAX_FEE_PER_GAS}"
export GAS_LIMIT="${GAS_LIMIT}"

export MINE_WORKERS="${MINE_WORKERS:-7}"
export MINT_LEVEL="${MINT_LEVEL:-8}"

#######################################################################
# Mine & Mint (via fifo)

FIFO_PATH="/tmp/fifo-pipe"
rm --force "$FIFO_PATH"
mkfifo "$FIFO_PATH"

echo '{"step":"[init|🏁]","now":"'$(iso_date)'"}'
banq xpow-init -YP --json | sed '1d'

sleep 1

echo '{"step":"[mint|⚡]","now":"'$(iso_date)'"}'
banq xpow-mint -YP --json \
    --max-priority-fee-per-gas="$MAX_PRIORITY_FEE_PER_GAS" \
    --max-fee-per-gas="$MAX_FEE_PER_GAS" \
    --gas-limit="$GAS_LIMIT" \
    < "$FIFO_PATH" 2>&1 \
    | grep -v 'exiting on signal 15' &

sleep 1

for i in $(seq "$MINE_WORKERS"); do
    printf "{\"step\":\"[mine|%02d]\",\"now\":\"$(iso_date)\"}\n" "$i"
    banq xpow-mine -YP --json \
        --pow-level="$MINT_LEVEL" \
        --to="$MINT_ADDRESS" \
        >> "$FIFO_PATH" &
done

#######################################################################
#######################################################################
