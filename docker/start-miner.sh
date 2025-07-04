#!/bin/sh
#######################################################################
# Start cron (to restart each hour)

/usr/sbin/crond -f 2>&1 | sed '1d' &

#######################################################################
# Load secrets (or fail)

if [ -z "$MINT_ADDRESS" ]; then
    SECRET_PATH="/var/run/secrets/xpower-mint-address"
    if [ -f "$SECRET_PATH" ]; then
        export MINT_ADDRESS="$(cat "$SECRET_PATH")"
    else
        echo "MINT_ADDRESS missing"
        exit 1
    fi
fi

if [ -z "$MINT_ADDRESS_PK" ]; then
    SECRET_PATH="/var/run/secrets/xpower-mint-address-pk"
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

export MAX_PRIORITY_FEE_PER_GAS="${MAX_PRIORITY_FEE_PER_GAS:-1000000000}"
export MAX_FEE_PER_GAS="${MAX_FEE_PER_GAS:-1000000000}"
export GAS_LIMIT="${GAS_LIMIT:-100000}"

export MINE_WORKERS="${MINE_WORKERS:-3}"
export MINT_LEVEL="${MINT_LEVEL:-6}"

#######################################################################
# Start miner loop (with socat)

while true; do
    banq xpow-init -YP --json | sed '1d'
    sleep 1

    socat TCP-LISTEN:8765,reuseaddr,fork \
        SYSTEM:"banq xpow-mint -YP --json \
            --max-priority-fee-per-gas=$MAX_PRIORITY_FEE_PER_GAS \
            --max-fee-per-gas=$MAX_FEE_PER_GAS \
            --gas-limit=$GAS_LIMIT" &

    SOCAT_PID=$!
    sleep 1

    for i in $(seq 1 "$MINE_WORKERS"); do
        banq xpow-mine -YP --json \
            --pow-level="$MINT_LEVEL" \
            | socat - TCP:127.0.0.1:8765 &
    done

    wait $SOCAT_PID
    sleep 1
done

#######################################################################
#######################################################################
