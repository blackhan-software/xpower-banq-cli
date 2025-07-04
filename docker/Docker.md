```quote
**WARNING:** ⚠️🔥⚠️ MINING CAN SERIOUSLY **DAMAGE** YOUR DEVICE! 🔥⚠️🔥
```

# XPower Miner

Set the RPC end-point (optional):

```sh
PROVIDER_URL=https://api.avax.network/ext/bc/C/rpc # default
```

Set minting private-key and address (required); plus the level (optional):

```sh
MINT_ADDRESS_PK=0x.. # private key
MINT_ADDRESS=0x.. # beneficiary
MINT_LEVEL=8 # default
```

Set mining workers (optional): number of CPU cores

```sh
MINE_WORKERS=7 # default
```

Then, run the docker instance to start mining — with _automatic_ gas parameters:

```sh
docker run --rm -ti \
-e PROVIDER_URL="$PROVIDER_URL" \
-e MINT_ADDRESS_PK="$MINT_ADDRESS_PK" \
-e MINT_ADDRESS="$MINT_ADDRESS" \
-e MINT_LEVEL="$MINT_LEVEL" \
-e MINE_WORKERS="$MINE_WORKERS" \
xpowermine/miner
```

Or, run the docker instance — with _custom_ gas parameters:

```sh
MAX_PRIORITY_FEE_PER_GAS=0 # 0.0 gwei — default: auto
MAX_FEE_PER_GAS=500000000 # 0.5 gwei — default: auto
GAS_LIMIT=100000 # 0.1 mwei — default: auto
```

```sh
docker run --rm -ti \
-e PROVIDER_URL="$PROVIDER_URL" \
-e MINT_ADDRESS_PK="$MINT_ADDRESS_PK" \
-e MINT_ADDRESS="$MINT_ADDRESS" \
-e MINT_LEVEL="$MINT_LEVEL" \
-e MINE_WORKERS="$MINE_WORKERS" \
-e MAX_PRIORITY_FEE_PER_GAS="$MAX_PRIORITY_FEE_PER_GAS" \
-e MAX_FEE_PER_GAS="$MAX_FEE_PER_GAS" \
-e GAS_LIMIT="$GAS_LIMIT" \
xpowermine/miner
```

## FAQ

### What should `PROVIDER_URL` be set to?

`PROVIDER_URL=https://api.avax.network/ext/bc/C/rpc` (default) is the public RPC
end-point of the Avalanche network, which seems to work fine — most of the time.
However, if your container is behind a popular VPN or your minting frequency is
high, then using your own custom end-point is recommended.

### What should `MINT_ADDRESS_PK` be set to?

Setting `MINT_ADDRESS_PK=0x..` is _required_, and it should be set to the
_private key_ of of an address that holds some AVAX — to pay for minting costs.
Due to operational security, it is _not_ recommended to fund the address with
large amounts of AVAX, but instead to regularly refill it.

### What should `MINT_ADDRESS` be set to?

Setting `MINT_ADDRESS=0x..` is _required_, and it can be set to the address that
corresponds to `MINT_ADDRESS_PK`. However, due to operational security, it is
recommended to use a _different_ beneficiary address — to receive the mined and
minted XPOW tokens.

### What should `MINT_LEVEL` be set to?

`MINT_LEVEL=8` (default) ensures that only work, which corresponds to
`2^8-1=255` XPOW (or more), gets minted. Increasing this parameter implies that
the miner has to work _longer_, but the XPOW rewards per mint are then also
_higher_: A trade off between energy consumption vs minting costs. Given the
current state-of-art CPUs, setting `MINT_LEVEL=8` (or higher) is recommended.

### What should `MINE_WORKERS` be set to?

Setting `MINE_WORKERS=7` (default) specifies that `7` mining engines shall be
used, which is appropriate if your CPU has 8 cores. Hence, it is recommended to
set `MINE_WORKERS` to one _less_ than your number of CPU cores.

### What should `MAX_PRIORITY_FEE_PER_GAS` be set to?

`MAX_PRIORITY_FEE_PER_GAS=` (default) specifies that the blockchain shall
_automatically_ choose the most appropriate priority fee. However, using
`MAX_PRIORITY_FEE_PER_GAS=0` to avoid paying such an extra fee _seems_ to be
working, and hence recommended. Increase it in case the minting transactions are
regularly rejected (perhaps upto 1 Gwei i.e. `1000000000`).

### What should `MAX_FEE_PER_GAS` be set to?

`MAX_FEE_PER_GAS=` (default) specifies that the blockchain shall _automatically_
choose the most appropriate fee. However, using `MAX_FEE_PER_GAS=500000000` (0.5
Gwei), or perhaps even less, _seems_ to be working, and hence recommended.
Again, increase it in case the minting transactions are regularly rejected
(perhaps up to 1 Gwei i.e. `1000000000`).

### What should `GAS_LIMIT` be set to?

`GAS_LIMIT=` (default) specifies that the blockchain shall _automatically_
choose the most appropriate gas limit. However, using `GAS_LIMIT=100000` (0.1
Mwei), _seems_ to be working, and hence recommended.
