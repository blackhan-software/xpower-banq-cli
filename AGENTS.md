# AGENTS.md

Deno v2 CLI for lending/borrowing XPOW and APOW on Avalanche C-Chain (ethers.js v6).

## Commands

```sh
npm install                  # runs `deno install --node-modules-dir=auto --allow-scripts=npm:usb@2.9.0,npm:node-hid@2.1.2,npm:keccak@3.0.4` (not plain npm); node_modules/ is required for npm: specifier deps + Ledger native modules
npm run banq -- [args]       # run CLI (mainnet env)
npm run calc                 # separate calc CLI (no env files)
npm test                     # cli/ + cmd/ tests only (runs test:cli then test:cmd)
npm run test:all             # ALL tests including test/ (needs anvil on $PATH)
npm run test:cli             # cli/ only
npm run test:cmd             # cmd/ only
npm run lint                 # deno lint
deno check                   # typecheck (CI-enforced, NOT in any npm script)
deno fmt                     # format (excludes *.md); CI runs `deno fmt --check`

# Single test file (generate config first, then --env):
deno run -A cfg/generate.ts --network=testnet && deno test -A --env=.env/banq.testnet.env cmd/banq/supply-tokens.test.ts
```

CI gate order (`.github/workflows/ci-main.yml`): `deno fmt --check` → install → `python3 npm/postinstall.py` → `deno check` → `deno lint` → generate config → `deno test`. Run `deno check` and `deno fmt` before finishing — `npm run lint`/`npm test` alone won't catch type or format failures that break CI.

**`npm/postinstall.py` is required**: `@ledgerhq/*` packages export ESM with extensionless relative imports (`"./errors"`). Deno requires `.js` extensions, so the script strips the `"import"` condition from their `package.json`, routing to the CJS entry. Without `node_modules/` (from `npm install`) + `postinstall`, Ledger wallet imports fail. `npm install` runs `npm/postinstall.sh` (shell completion + calls `postinstall.py`); CI runs `python3 npm/postinstall.py node_modules/@ledgerhq/*/package.json` directly.

**Never use bare `deno test -A`** — tests require the generated `.env/banq.testnet.env`. Use `npm test` or run `deno run -A cfg/generate.ts --network=testnet && deno test -A --env=.env/banq.testnet.env`.

## Config files

YAML is the source of truth in `yml/` (`yml/banq.{net}.yaml` committed, `yml/banq.{net}.local.yaml` gitignored). `cfg/generate.ts` flattens the layers into a dotenv artifact (`.env/banq.{net}.env`, gitignored) consumed by `--env` flags on `deno run`/`deno test`/`deno compile`.

- **Run (dev)**: base + local overlay → `deno run -A cfg/generate.ts --network=mainnet && deno run -A --env=.env/banq.mainnet.env ./cli/banq/banq-main.ts`
- **Test (dev)**: base + local overlay → `deno run -A cfg/generate.ts --network=testnet && deno test -A --env=.env/banq.testnet.env`
- **Build/CI**: base only (`--no-local`), no secret/override overlay

Key sections: `provider.urls` (was `PROVIDER_URL`), `accounts.private_key`/`hd_path` (was `PRIVATE_KEY`/`HD_PATH`), `contract_run` (v10b / v10c / v11a, default v10c), `contracts.caps` / `contracts.pools` (per-run addresses), `contacts` (role labels, folded from the removed `.env.contacts`).

**⚠️ Every `0x…` address must be double-quoted in YAML** — an unquoted `0x…` scalar is parsed as a number by the YAML parser, dropping leading zeros/casing; `cfg/generate.ts` rejects it with a validation error.

Static addresses flatten to `{PREFIX}_ADDRESS_{RUN}` (`CAPS_ADDRESS_{run}`, `P{id}_ADDRESS_{run}`, per-pool `{POOL}_CAPS_ADDRESS_{run}`) plus `{ROLE}_ADDRESS` contacts; resolve via `env/find-by.ts` (`address_by(prefix, run)`). Tokens (XPOW/APOW), oracles (T000…) and ACMA are **not** in env — `env/registry.ts` discovers them on-chain (`pool.tokens()`/`oracle()`/`authority()`), memoized per `(chainId, run)`. `RunVersion` union in `arg/types.ts` is the source of truth for valid runs; ABIs live in `cmd/banq/abi/version/`. `contacts` flatten to `{ROLE}_ADDRESS` (role/actor addresses, used for ACMA name display).

**CI loads base only** (`--no-local`), no `.local` overlay. Local dev includes the `.local` overlay.

## Directory map

| Directory | Purpose |
|---|---|
| `cli/banq/` | Entry point (`banq-main.ts`), command router (`banq.ts`), arg parsing |
| `cmd/banq/` | Command impls, each with co-located `.test.ts`. `abi/`, `tool/` subdirs |
| `arg/` | Modular positional arg and option parsers |
| `cfg/` | Config tooling: `types.ts`, `load.ts`, `flatten.ts`, `generate.ts` |
| `yml/` | YAML config source of truth: `banq.{net}.yaml` + gitignored `banq.{net}.local.yaml` |
| `env/` | Address lookup (`find-by.ts`), oracle addresses |
| `function/` | `address.ts` (`addressOf`/`abbressOf`), type conversions |
| `wallet/` | Private-key or Ledger hardware wallet |
| `pow/` | WASM proof-of-work mining |
| `test/` | Integration (`anvil`-forked testnet), failure, wallet tests |
| `cli/calc/` | Separate `calc` CLI tool — no env files |
| `constant/` | `UNIT_BIG` (10^18 bigint), `UNIT_DEC` (Decimal) |

## Architecture notes

- **Lazy command loading**: Commands are `import()`-ed on first use via `LazyCommandFn` map.
- **Command dispatch**: `cli_banq(args)` is an async generator yielding `[Command, Argument[], Result[]]` tuples. Tests use `cli_next(args)` for single-command extraction.
- **Dry-run by default**: All tx commands need `--broadcast` (`-Y`) to actually execute. Without it, returns `[args, [false]]`.
- **Address convention**: All addresses are `bigint` internally. `addressOf(n)` (aliased `x`) → checksummed hex. `abbressOf(n)` (aliased `y`) → abbreviated `0xABCD…1234`. CLI hex literals use `n` suffix (`0x123abcn`).
- **Config**: YAML layers in `yml/` are flattened to dotenv by `cfg/generate.ts` for `--env`; `cfg/flatten.ts` is the single canonical inverse mapping.
- **All ethers.js Contract calls are async**, including view/pure functions — always `await`.
- **Universal flags**: `--json`/`-j` (output format), `--no-progress`/`-P` (suppress spinner; needed when piping `xpow-mine` → `xpow-mint`).
- **PoW timeout**: Supply/borrow may need proof-of-work (default 300s timeout).
- **Shell completion**: `banq-completion.bash` at repo root. All commands implement `args.list_options`.
- **`--watch` variants** (reindex, retwap, track-position): `--watch` (live WebSocket), `--watch=DLT` (last N blocks), `--watch=DLT@IDX` (chunked history), `--watch=DLT@all` (binary-search deploy block, walk forward).
- **`acma` subcommands**: Internal router in `cmd/banq/acma.ts` — `show`, `roles`, `members`, `targets`, `hierarchy`, `delays`, `logs`.

## Command implementation pattern

Every `cmd/banq/` command follows this structure:
1. Check `args.list_options` (shell completion) → return early if true
2. Parse positional args from `args.rest` via `arg_*()` parsers
3. If `!args.broadcast`, return dry-run result: `[[amount, symbol], [false]]`
4. Create wallet via `wallet(args)` (use `wallet(args, true)` for read-only)
5. Interact with contracts, return `[Argument[], Result[]]` tuple
6. Catch ethers.js `isCallException` for revert reasons

## Testing

```ts
import { cli_next } from "../../cli/banq/banq.ts";
Deno.test("banq -p P000 [supply, 1.0, APOW]", { permissions: { env: true } }, async () => {
  const args = { pool: "P000", rest: ["supply", 1.0, "APOW"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["supply", [1.0, "APOW"], [false]]);
});
```

- Tests exercise dry-run mode — no broadcast, no transactions.
- `test/` integration tests auto-skip if `anvil` not on `$PATH` (uses `ignore: !ANVIL_AVAILABLE`).
- Co-located tests: `supply-tokens.test.ts` next to `supply-tokens.ts`.

## Build

- Current platform: `deno run build-banq-mainnet` / `deno run build-banq-testnet` (wraps `build-banq.ts`). No bare `build-banq` task exists.
- Specific target: `deno run build-banq-{os}-{arch}-{network}`
  - **os**: `linux`, `macos`, `mswin`
  - **arch**: `x86_64` (alias `x64`), `aarch64` (alias `arm64`)
  - **network**: `mainnet`, `testnet`
- Output: `dist/banq-{network}.{arch}-{os}.{run|exe}`
- Release: auto on `v*` tags, all combos (excl. Windows ARM64).

## Code style

- **Strongly prefer `const`** over `let`. Use `let` only when reassignment is unavoidable.
