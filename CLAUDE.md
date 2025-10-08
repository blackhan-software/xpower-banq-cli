# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

XPower Banq CLI is a command-line interface for lending and borrowing XPOW and APOW tokens on the Avalanche blockchain. It includes position management, oracle operations, interest rate queries, and XPOW mining/minting capabilities.

## Technology Stack

- **Runtime**: Deno v2.0.0+ (TypeScript)
- **Blockchain**: Avalanche C-Chain (ethers.js v6)
- **Hardware Wallet**: Ledger via `@ledgerhq/hw-app-eth`
- **WASM Mining**: `@blackhan-software/wasm-miner` for proof-of-work
- **Deno imports**: `@std/assert`, `@std/cli`, `@std/dotenv`

## Development Commands

```sh
npm install                                        # install deps (wraps deno install with --allow-scripts)
npm run banq -- [args]                             # run CLI (loads mainnet env files)
npm test                                           # run cli/ and cmd/ tests (excludes test/)
npm run test:all                                   # run ALL tests including test/ (integration, failure, wallet)
npm run test:cli                                   # run only cli/ tests
npm run test:cmd                                   # run only cmd/ tests
npm run lint                                       # lint
npm run calc -- [args]                             # run calc CLI (no env files needed)

deno test -A --env=./etc/banq/banq.env.testnet \
  --env=.env.testnet --env=.env.testnet.local \
  cmd/banq/supply-tokens.test.ts                   # run single test file

deno fmt                                           # format (excludes *.md)
deno run build-banq                                # build for current platform (mainnet)
deno run build-banq-{os}-{arch}-{network}          # build specific target (e.g. build-banq-linux-x86_64-testnet)
deno run clean                                     # rm -rf dist/
```

**Important**: Do NOT use bare `deno test -A` — it won't load the required env files (`CONTRACT_RUN` etc.) and tests will fail. Always use `npm test` or pass the `--env` flags explicitly.

**CI note**: CI loads only 2 env files (`etc/banq/banq.env.testnet`, `.env.testnet`) — no `.local` override. Local dev loads 3 (adds `.env.testnet.local`). This asymmetry can cause CI-only failures.

## Environment Files

`.env` is a symlink to `.env.mainnet` or `.env.testnet`. Env files are loaded in order with later files overriding earlier ones:

- **Run**: `etc/banq/banq.env.mainnet` → `.env.mainnet` → `.env.mainnet.local`
- **Test**: `etc/banq/banq.env.testnet` → `.env.testnet` → `.env.testnet.local`

Key variables: `PROVIDER_URL`, `PRIVATE_KEY`, `CONTRACT_RUN` (version selector: `v10a` or `v10b`)

Versioned addresses follow the pattern `{PREFIX}_ADDRESS_{VERSION}` (e.g., `P000_ADDRESS_v10a`, `APOW_ADDRESS_v10b`). Unversioned `{PREFIX}_ADDRESS` is also supported.

`env/find-by.ts` provides bidirectional lookup:
- `address_by(prefix, suffix)` — e.g., `address_by("P000", "v10a")` → pool address
- `prefix_by(address)` / `suffix_by(address)` — reverse lookups: address → name or version

## Architecture

### Directory Layout

- **`cli/banq/`** — Entry point (`banq-main.ts`), command router (`banq.ts`), arg parsing (`banq-args.ts`)
- **`cmd/banq/`** — Command implementations, each with co-located `.test.ts` files. ABIs in `cmd/banq/abi/`, utilities in `cmd/banq/tool/`
- **`arg/`** — Modular parsers: `arg-*.ts` for positional args (amount, token, address), `opt-*.ts` for options (pool, oracle, gas, contract-run)
- **`env/`** — `find-by.ts` (bidirectional address lookup from env vars), `oracles.ts` (oracle addresses T000–T006)
- **`wallet/`** — Unified wallet interface dispatching to private-key or Ledger hardware wallet
- **`function/`** — Utilities: `dotenv.ts` (env loading), `address.ts` (`addressOf`/`abbressOf`), `parse-args.ts`, type conversions, sleep/timeout
- **`pow/`** — Proof-of-work mining via WASM (KeccakHasher), `Miner` class with ABI encoding
- **`constant/`** — `UNIT_BIG` (10^18 bigint) and `UNIT_DEC` (Decimal)
- **`test/`** — `integration/` (Anvil-forked testnet transactions), `failure/` (error modes), `wallet/` (provider tests). Auto-skipped if `anvil` not on `$PATH`
- **`cli/calc/`** — Secondary `calc` CLI tool (interest-rate calculator, independent from `banq`, no env files)
- **`etc/`** — CLI spinner utility (`cli-spinner.ts`), shared env defaults, `plot-rates.py`

### Command Router (Async Generator Pattern)

`cli/banq/banq.ts` exports:
- `cli_banq(args)` — async generator yielding `[Command, Argument[], Result[]]` tuples
- `cli_next(args)` — single-command helper (used extensively in tests)

Commands are lazily loaded via `LazyCommandFn` — each module is `import()`-ed on first use for startup performance.

Commands are dispatched by name or short alias: `pass`/`pa`, `supply`/`su`, `borrow`/`bo`, `settle`/`se`, `redeem`/`re`, `liquidate`/`li`, `refresh`/`rf`, `retwap`/`rt`, `reindex`/`ri`, `health-of`/`ho`, `rates-of`/`ro`, `xpow-init`/`xi`, `xpow-mine`/`xm`, `xpow-mint`/`xt`, `apow-claim`/`ac`, `apow-claim-batch`/`acb`.

### `--watch` Flag Variants

Commands that support `--watch` (`reindex`, `retwap`) accept several forms:
- `--watch` — live-subscribe to new events via WebSocket
- `--watch=DLT` — query the last `DLT` blocks for historical events
- `--watch=DLT@IDX` — query a `DLT`-sized chunk `IDX` chunks back from present (window: `[BLK-DLT*(1+IDX), BLK-DLT*IDX]`)
- `--watch=DLT@all` — binary-search for the contract's deployment block (`blockSearch` in `cmd/banq/tool/block-search.ts`), then walk forward to present in `DLT`-sized chunks emitting all historical events oldest-first

### Shared Utilities (`cmd/banq/tool/`)

- **`block-search.ts`** — Generic binary search for a contract's deployment block via `provider.getCode(address, blockNumber)`
- **`block-range.ts`** — Converts `[dlt, idx?]` range tuples into `[fromBlock, toBlock]` pairs
- **`position-of.ts`** — Resolves a token + mode (`supply`/`borrow`) to a POSITION contract address via the POOL contract; also exports `my()` for position symbols (`sAPOW`, `bXPOW`)
- **`rel-delta.ts`** — Computes relative price delta between oracle and feed quotes (used by `retwap`)
- **`completions.ts`** — `list_options()` helper for shell completion output
- **`approve.ts`** — ERC-20 token approval helper
- **`apow.ts`** — APOW supply-data encoding (`supplyData`), pool contract factory (`poolOf`), and owner fetching (`fetch_owner`)
- **`asciichart.ts`** — Terminal ASCII chart rendering (ported from kroitor/asciichart) with ANSI color support
- **`call.ts`** — Generic contract call wrapper: executes an async fn, catches `isCallException` reverts, returns `CommandResult`
- **`map-by.ts`** — `mapBy(records, key)` — indexes an array of objects into a record by a specified key
- **`pow-tx.ts`** — `pow_send()` — encodes calldata, solves proof-of-work, and sends the transaction (used by supply/borrow)
- **`power-set.ts`** — String powerset/permutation generation (used by `rates-plot.ts` subplot matching)
- **`rates.ts`** — Interest rate computation: supply/borrow rates from utilization, formatting helpers
- **`rates-plot.ts`** — Terminal rate plotting: utilization/supply/borrow subplots with log-scale support via `asciichart.ts`
- **`token.ts`** — Token info type (`TokenInfo`), formatting (exponential/fixed/decimal), and `totalSupply` fetcher
- **`utils.ts`** — Utilization history: fetches `Reindex` events from supply/borrow positions, supports pagination and indexing
- **`acma-*.ts`** — Access-control manager (ACMA) event fetching, decoding, state reconstruction, formatting, and caching

### Command Implementation Pattern

Every command in `cmd/banq/` follows this structure:
1. Check `args.list_options` (for shell completion) — return early if true
2. Parse positional args from `args.rest` using `arg_*()` parsers
3. If `!args.broadcast`, return dry-run result: `[[amount, symbol], [false]]`
4. Create wallet/signer via `wallet(args)` — call `wallet(args, true)` for read-only queries (generates random key if no `PRIVATE_KEY`)
5. Interact with contracts via `ethers.Contract` — token approval, then pool operation
6. Return `[Argument[], Result[]]` tuple: `[false]` = dry-run, `[true]` = broadcast success, `[reason]` = revert
7. Catch ethers.js `isCallException` to extract revert reasons into the result tuple

### Address Handling

Addresses are stored as `bigint` throughout the codebase. The convention is:
- `addressOf(n)` (aliased as `x`) converts bigint → checksummed hex string for ethers.js calls
- `abbressOf(n)` (aliased as `y`) produces abbreviated `0xABCD…1234` format
- CLI args accept hex literals with `n` suffix (e.g., `0x123abcn`) which are parsed to bigint via `arg/parser.ts`

### Contract Calls

All ethers.js `Contract` method calls are async and return `Promise<T>`, including view/pure functions. Always `await` them.

### Wallet System

`wallet/index.ts` dispatches based on `options.ledger`:
- `pk-wallet.ts` — uses `PRIVATE_KEY` env var (or generates random key); supports both HTTP and WebSocket providers
- `hw-ledger-wallet.ts` + `hw-ledger-signer.ts` — Ledger hardware wallet via `@ledgerhq/hw-app-eth`

## Testing

Tests are co-located with implementations (`supply-tokens.test.ts` next to `supply-tokens.ts`). Pattern:

```typescript
import { cli_next } from "../../cli/banq/banq.ts";
const OPTS = { permissions: { env: true } };

Deno.test("banq -p P000 [supply, 1.0, APOW]", OPTS, async () => {
  const args = { pool: "P000", rest: ["supply", 1.0, "APOW"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["supply", [1.0, "APOW"], [false]]);
});
```

- Tests exercise dry-run mode (no `broadcast` flag), so no actual transactions occur
- Test names follow the convention `banq <options> [command, ...args]`
- Integration tests in `test/` use Foundry's Anvil to fork the testnet — auto-skipped via `ignore: !ANVIL_AVAILABLE` if `anvil` is not installed
- `npm test` runs `cli/` + `cmd/` only; use `npm run test:all` to include `test/` (integration, failure, wallet)

## Build & Release

Binaries are compiled via `deno compile` to `dist/`. Output naming: `banq-{network}.{arch}-{os}.{run|exe}` (e.g., `banq-mainnet.x86_64-linux.run`). Build tasks follow the pattern `build-banq-{os}-{arch}-{network}`:
- **OS**: `linux`, `macos`, `mswin`
- **Arch**: `x86_64`/`x64`, `aarch64`/`arm64`
- **Network**: `mainnet`, `testnet`

CI (`ci-main.yml`) runs format check → install → lint → test. Releases (`release.yml`) trigger on `v*` tags and build all platform/arch/network combinations (Windows ARM64 excluded).

## JSR Proxy Workaround

In restricted environments (e.g. Claude Code remote containers), `jsr.io` may be blocked by the egress proxy while `github.com` / `codeload.github.com` remain accessible. This prevents `deno test`, `deno cache`, and `npm test` from resolving `@std/*` imports — affecting **all** tests, not just specific ones.

**Symptoms**: `deno test` fails with `JSR package manifest for '@std/assert' failed to load`.

**Fix**: Run `etc/jsr-patch.sh` to vendor the `@std/*` packages from GitHub and generate a local import map:

```sh
# Generate the import map (downloads denoland/std from GitHub once, caches it)
IMPORT_MAP=$(bash etc/jsr-patch.sh)

# Run tests with the patched imports
deno test -A --no-lock --no-check --import-map="$IMPORT_MAP" \
  --env=./etc/banq/banq.env.testnet --env=.env.testnet cli/ cmd/
```

**How it works**:
1. Downloads `denoland/std` source tarball from `codeload.github.com` (allowed by proxy)
2. Reads each package's `deno.json` to discover all subpath exports (e.g. `@std/internal/build-message` → `internal/build_message.ts`)
3. Generates a Deno `--import-map` JSON redirecting all `@std/*` specifiers to local files
4. `--no-lock` skips lockfile integrity checks (versions may differ slightly from pinned)
5. `--no-check` skips TypeScript type-checking (avoids minor type errors in newer std versions)

**Flags explained**:
- `--import-map` — overrides JSR resolution with local file paths
- `--no-lock` — required because local files don't match lockfile hashes
- `--no-check` — the vendored `main` branch may have minor type differences vs pinned versions; runtime behavior is identical

## Code Style

- **`const` over `let`**: Strongly prefer `const` declarations. Use `let` only when reassignment is absolutely unavoidable. Extract helper functions to return values rather than mutating `let` bindings across branches.

## Key Design Decisions

- **Dry-run by default**: All transaction commands require explicit `--broadcast` (`-Y`) to execute
- **Bigint addresses**: All addresses stored as `bigint`, converted to hex strings only at ethers.js boundary
- **Modular parsers**: Each argument/option type has its own parser file in `arg/`, composable across commands
- **Lazy command loading**: Command modules are dynamically `import()`-ed on first use via `LazyCommandFn` map
- **PoW integration**: Supply and borrow operations may require proof-of-work depending on pool difficulty settings (default timeout: 300s)
- **Shell completion**: All commands implement `args.list_options` to output available options, then `Deno.exit(0)`. `banq-completion.bash` at repo root provides bash/zsh completion
- **`--json` / `-j`**: Universal flag controlling output format (human-readable vs JSON); used in `xpow-mine`/`xpow-mint` streaming pipeline
- **`--no-progress` / `-P`**: Suppresses spinner; required when piping `xpow-mine` output to `xpow-mint`
