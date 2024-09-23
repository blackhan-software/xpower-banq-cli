> Lend and borrow XPOW & APOW tokens; see also [xpowermine.com]! ⛏️⚡️

[xpowermine.com]: https://www.xpowermine.com

## Installation

💾 Copy `banq.x86_64-*.run` (or `*.exe`) to an installation folder:

```sh
[sudo] cp ./Downloads/banq.x86_64-linux.run /usr/local/bin/banq
```

🏦 Mark `banq` as an executable: on Linux (et al.)

```sh
[sudo] chmod +x /usr/local/bin/banq
```

## Usage

🔑 Define the private-key of your user account: optional

```sh
export PRIVATE_KEY=0x... # required -- unless the Ledger HW is used
```

🌐 Define the URL of an Avalanche RPC provider: optional

```sh
export PROVIDER_URL=https://api.avax.network/ext/bc/C/rpc # default
```

🏦 Invoke the `banq` command-line interface:

```sh
banq --help
```

```sh
banq <command> <argument(s)> [--option(s)]
```

### Position Management

💸 Supply `APOW` tokens: into `pool=P000`

```sh
banq supply 1.0 APOW [--pool=P000] [-Y|--broadcast]
```

💳 Borrow `XPOW` tokens: from `pool=P000`

```sh
banq borrow 1.0 XPOW [--pool=P000] [-Y|--broadcast]
```

🤑 Settle `XPOW` tokens: into `pool=P000`

```sh
banq settle 1.0 XPOW [--pool=P000] [-Y|--broadcast]
```

💰 Redeem `APOW` tokens: from `pool=P000`

```sh
banq redeem 1.0 APOW [--pool=P000] [-Y|--broadcast]
```

### User Management

🏥 Health of `$USER`'s positions: in `pool=P000`

```sh
banq health-of $USER [--pool=P000] [-Y|--broadcast] # USER=0x..
```

💦 Liquidate `$USER`'s positions: in `pool=P000`

```sh
banq liquidate $USER [--pool=P000] [-Y|--broadcast] # USER=0x..
```

### Oracle Management

💱 Refresh `XPOW/APOW` feed: for `oracle=T000`

```sh
banq refresh XPOW APOW [--oracle=T000] [-Y|--broadcast] # permissioned?
```

🔃 Retwap `XPOW/APOW` feed: for `oracle=T000`

```sh
banq retwap XPOW APOW [--oracle=T000] [-Y|--broadcast] # permissioned!
```

### Position Reindexing

🎡 Reindex supplied or borrowed tokens: in `pool=P000`

```sh
banq reindex APOW --mode=supply [--pool=P000] [-Y|--broadcast]
banq reindex XPOW --mode=borrow [--pool=P000] [-Y|--broadcast]
```

### Interest Rates

📈 Supply and borrow rate(s) of `XPOW`: in `pool=P000` at (±) index

```sh
banq rates-of XPOW [--pool=P000] [-@|--at=now] [-Y|--broadcast]
```

📉 Supply and borrow rate(s) of `APOW`: in `pool=P000` incl. history

```sh
banq rates-of APOW [--pool=P000] [-@|--at=all] [-Y|--broadcast]
```

### Access Manager (ACMA)

🔐 Show authorization matrix, roles, members, targets, hierarchy, delays, and logs:

```sh
banq acma [show|roles|members|targets|hierarchy|delays|logs] [-Y|--broadcast]
```

### XPOW Mining & Minting

⛏️ Mine and mint `XPOW` tokens: initialize once per hour, then mine and pipe to mint

```sh
banq xpow-init [-Y|--broadcast]
banq xpow-mine [-Y|--broadcast] -Pj --pow-level=8 | nc 127.0.0.1 8765
```

```sh
nc -l 8765 | banq xpow-mint [-Y|--broadcast] -Pj # nc: netcat; ingests hashes
```

### APOW Claiming

🎁 Claim `APOW` tokens: for single or multiple NFTs

```sh
banq apow-claim APOW --nft-id=202500 [-Y|--broadcast]
banq apow-claim-batch APOW --nft-id=202500,202503 [-Y|--broadcast]
```

## Copyright

© 2025 [Moorhead LLC](#)
