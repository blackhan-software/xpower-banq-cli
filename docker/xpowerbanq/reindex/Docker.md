# XPowerbanq/reindex

## Build

```sh
./docker/xpowerbanq/reindex/build.sh # image
```

## Run

Set the RPC end-point (optional):

```sh
PROVIDER_URL=https://api.avax.network/ext/bc/C/rpc # default
```

Set the contract-run (required): contracts to operate on

```sh
CONTRACT_RUN=v10a # v10b,...
```

Set private-key (optional):

```sh
BANQ_ADDRESS_PK=0x.. # private key
```

Set banq reindex symbols and pool (optional):

```sh
BANQ_SYMBOL0=APOW # default
BANQ_SYMBOL1=XPOW # default
BANQ_POOL=P000 # default
```

Then, run the docker instance to start listening to reindex events:

```sh
docker run --rm -ti \
-e PROVIDER_URL="$PROVIDER_URL" \
-e CONTRACT_RUN="$CONTRACT_RUN" \
-e BANQ_SYMBOL0="$BANQ_SYMBOL0" \
-e BANQ_SYMBOL1="$BANQ_SYMBOL1" \
-e BANQ_POOL="$BANQ_POOL" \
xpowerbanq/reindex
```

## FAQ

### What should `PROVIDER_URL` be set to?

`PROVIDER_URL=https://api.avax.network/ext/bc/C/rpc` (default) is the public RPC
end-point of the Avalanche network, which seems to work fine — most of the time;
use a websocket end-point like `wss://api.avax.network/ext/bc/C/ws` if latency
is relevant.

### What should `BANQ_ADDRESS_PK` be set to?

Setting `BANQ_ADDRESS_PK=0x..` is _optional_, and it should be set to the
_private key_ of an address that may hold no AVAX.

### What should `BANQ_SYMBOL{0,1}` be set to?

Set the 1st symbol to e.g. `APOW` (default) and the 2nd to e.g. `XPOW`
(default), `AVAX`, `USDC` or `USDT`.

### What should `BANQ_POOL` be set to?

Use `BANQ_POOL=P000`, `P001`, `P002` or `P003` to determine the pool to operate
in.
