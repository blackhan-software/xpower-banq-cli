# AGENTS.md

Deno v2 CLI for lending/borrowing XPOW and APOW on Avalanche C-Chain (ethers.js v6).

## Commands

```sh
npm install                  # runs `deno install --node-modules-dir=auto` (not plain npm); node_modules/ is required for npm: specifier deps
npm run banq -- [args]       # run CLI (mainnet env)
npm test                     # cli/ + cmd/ tests only (runs test:cli then test:cmd)
npm run test:all             # ALL tests including test/ (needs anvil on $PATH)
npm run test:cli             # cli/ only
npm run test:cmd             # cmd/ only
npm run lint                 # deno lint
deno check                   # typecheck (CI-enforced, NOT in any npm script)
deno fmt                     # format (excludes *.md); CI runs `deno fmt --check`

# Single test file (must pass --env flags):
deno test -A --env=./etc/banq/banq.env.testnet --env=.env.testnet cmd/banq/supply-tokens.test.ts
```

CI gate order (`.github/workflows/ci-main.yml`): `deno fmt --check` → install → `python3 npm/postinstall.py` → `deno check` → `deno lint` → `deno test` (2 env files, all dirs). Run `deno check` and `deno fmt` before finishing — `npm run lint`/`npm test` alone won't catch type or format failures that break CI.

**`npm/postinstall.py` is required**: `@ledgerhq/*` packages export ESM with extensionless relative imports (`"./errors"`). Deno requires `.js` extensions, so the script strips the `"import"` condition from their `package.json`, routing to the CJS entry. Without `node_modules/` (from `npm install`) + `postinstall`, Ledger wallet imports fail.

**Never use bare `deno test -A`** — tests require `--env` flags for `CONTRACT_RUN` etc. Use `npm test` or pass `--env=./etc/banq/banq.env.testnet --env=.env.testnet`.

## Env files

`.env` is a symlink to `.env.mainnet` or `.env.testnet`. Load order (later overrides earlier):

- **Run**: `etc/banq/banq.env.mainnet` → `.env.mainnet` → `.env.mainnet.local`
- **Test**: `etc/banq/banq.env.testnet` → `.env.testnet` → `.env.testnet.local`

Key vars: `PROVIDER_URL`, `PRIVATE_KEY`, `CONTRACT_RUN` (v10a / v10b).

**CI loads only 2 files** (`etc/banq/banq.env.testnet`, `.env.testnet`), no `.local` override. Local dev loads 3.

## Directory map

| Directory | Purpose |
|---|---|
| `cli/banq/` | Entry point (`banq-main.ts`), command router (`banq.ts`), arg parsing |
| `cmd/banq/` | Command impls, each with co-located `.test.ts`. `abi/`, `tool/` subdirs |
| `arg/` | Modular positional arg and option parsers |
| `env/` | Address lookup (`find-by.ts`), oracle addresses |
| `function/` | `address.ts` (`addressOf`/`abbressOf`), `dotenv.ts`, type conversions |
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
- **All ethers.js Contract calls are async**, including view/pure functions — always `await`.
- **Universal flags**: `--json`/`-j` (output format), `--no-progress`/`-P` (suppress spinner; needed when piping `xpow-mine` → `xpow-mint`).
- **PoW timeout**: Supply/borrow may need proof-of-work (default 300s timeout).
- **Shell completion**: `banq-completion.bash` at repo root. All commands implement `args.list_options`.
- **`--watch` variants** (reindex, retwap): `--watch` (live WebSocket), `--watch=DLT` (last N blocks), `--watch=DLT@IDX` (chunked history), `--watch=DLT@all` (binary-search deploy block, walk forward).
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
