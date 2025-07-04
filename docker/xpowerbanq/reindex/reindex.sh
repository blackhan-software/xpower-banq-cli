#!/bin/sh
#######################################################################
# Utility functions

iso_date() {
    date -u +%Y-%m-%dT%H:%M:%S.%3NZ
}

#######################################################################
# Load secrets

if [ -z "$BANQ_ADDRESS_PK" ]; then
    SECRET_PATH="/var/run/secrets/banq-address-pk"
    if [ -f "$SECRET_PATH" ]; then
        export PRIVATE_KEY="$(cat "$SECRET_PATH")"
    fi
else
    export PRIVATE_KEY="$BANQ_ADDRESS_PK"
fi

#######################################################################
# Defaults

export SYMBOL0="${BANQ_SYMBOL0-APOW}"
export SYMBOL1="${BANQ_SYMBOL1-XPOW}"
export POOL="${BANQ_POOL-P000}"

#######################################################################
# Watch Reindex

echo '{"step":"[reindex|'"$SYMBOL0/supply"']","now":"'$(iso_date)'"}'
banq reindex -YP --watch "$SYMBOL0" --pool="$POOL" --mode="supply" &
echo '{"step":"[reindex|'"$SYMBOL0/borrow"']","now":"'$(iso_date)'"}'
banq reindex -YP --watch "$SYMBOL0" --pool="$POOL" --mode="borrow" &

echo '{"step":"[reindex|'"$SYMBOL1/supply"']","now":"'$(iso_date)'"}'
banq reindex -YP --watch "$SYMBOL1" --pool="$POOL" --mode="supply" &
echo '{"step":"[reindex|'"$SYMBOL1/borrow"']","now":"'$(iso_date)'"}'
banq reindex -YP --watch "$SYMBOL1" --pool="$POOL" --mode="borrow" &

wait

#######################################################################
#######################################################################
