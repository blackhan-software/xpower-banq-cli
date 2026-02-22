# Code Review: xpower-banq-cli

## Overview

XPower Banq CLI is a Deno-based command-line tool for lending/borrowing XPOW and APOW tokens on Avalanche. The codebase is well-structured with ~117 TypeScript files, 26 test files, 16 command implementations, and a cross-platform build system targeting 5 OS/arch combinations.

**Overall assessment**: The project demonstrates strong architectural consistency and good separation of concerns. The main areas for improvement are a few missing error re-throws (bugs), the if-else command dispatch pattern, and test coverage gaps for broadcast/integration paths.

---

## Bugs

### 1. Missing `throw e` in `refresh-oracle.ts:62-67`

```typescript
} catch (e) {
  if (isCallException(e)) {
    return [[src_symbol, tgt_symbol], [e.reason]];
  }
  // BUG: non-CallException errors are silently swallowed
}
```

Every other command in the codebase re-throws non-call-exception errors. This catch block silently swallows unexpected errors (network failures, type errors, etc.), making them invisible. The function then falls through to return `[[src_symbol, tgt_symbol], [true]]` as if the operation succeeded.

**Fix**: Add `throw e;` after the `if` block.

### 2. Missing `throw e` in `retwap-oracle.ts:207-213`

Same pattern as above in the `execute()` function:

```typescript
} catch (e) {
  if (isCallException(e)) {
    return [[source_symbol, target_symbol], [e.reason]];
  }
  // BUG: same silent swallow
}
```

**Fix**: Add `throw e;` after the `if` block.

### 3. `rhs_of()` in `retwap-oracle.ts:234-243` swallows all errors

```typescript
async function rhs_of(...): Promise<[bigint | null, bigint | null]> {
  try {
    return await FEED.getQuotes(amount);
  } catch (_) {
    return [null, null];  // all errors → null
  }
}
```

Unlike `lhs_of()` which correctly distinguishes call exceptions from other errors, `rhs_of()` catches everything including network failures, type errors, etc. This asymmetry may be intentional for graceful degradation, but it's inconsistent and could mask real problems.

### 4. Regex bug in `opt-at.ts:15`

```typescript
if (arg.match(/^all$$/i)) {
```

The double `$$` creates the regex `/^all$$/i` which matches `"all$"` (a literal dollar sign after "all") rather than just `"all"`. This means `--at=all` won't match, breaking the "all" keyword.

**Fix**: Change to `/^all$/i` (single `$`).

### 5. Potential stack overflow in `largeRandom()` (`xpow-mine.ts:155-161`)

```typescript
function largeRandom(length: number): bigint {
  const bytes = crypto.randomBytes(length);
  if (bytes[0] > 15) {
    return bytes.readBigUInt64BE();
  }
  return largeRandom(length);  // recursive with no depth limit
}
```

This recursion filters out values where `bytes[0] <= 15` (probability ~6.25%). While a stack overflow is statistically unlikely, it's not bounded. A `while` loop would be safer:

```typescript
function largeRandom(length: number): bigint {
  while (true) {
    const bytes = crypto.randomBytes(length);
    if (bytes[0] > 15) return bytes.readBigUInt64BE();
  }
}
```

---

## Architecture

### Strengths

- **Consistent command pattern**: Every command follows the same structure — parse args, check `--broadcast`, create wallet, interact with contract, return `[Argument[], Result[]]`. This makes the codebase very predictable.

- **Dry-run by default**: All transaction commands require explicit `--broadcast` / `-Y`. This is an excellent safety design for a financial CLI tool.

- **Modular argument parsers**: The `arg/` directory provides composable parsers (`arg_amount`, `arg_token`, `opt_pool`, `opt_gas`, etc.) that are reused across all commands.

- **Async generator CLI loop**: The `cli_banq()` async generator in `banq.ts` enables streaming command output with spinner management between results. This is a clean pattern for a multi-command CLI.

- **Wallet abstraction**: Clean separation between private-key wallets and Ledger hardware wallets behind a unified `wallet()` interface with conditional generic types.

- **CI/CD pipeline**: GitHub Actions runs format checks, linting, and tests on PR/push. The release workflow handles multi-platform builds automatically.

- **Contract version system**: The `v10a`/`v10b` suffix scheme with `CONTRACT_RUN` env var allows coexistence of multiple contract versions.

### Areas for Improvement

#### Command dispatch is a long if-else chain (`banq.ts:34-104`)

The 16-command dispatch uses sequential if-else comparisons. A `Map<string, CommandFn>` or `switch` statement would be cleaner and scale better:

```typescript
const COMMANDS = new Map([
  ["su", supply], ["supply", supply],
  ["bo", borrow], ["borrow", borrow],
  // ...
]);
```

This would also make it trivial to generate the help/completions list from the same source of truth, eliminating the duplicated command lists in `banq-main.ts:16-51`.

#### Hardcoded command lists in multiple places

Command names and aliases appear in at least three locations:
- `banq.ts` (dispatch)
- `banq-main.ts` (--list-commands output)
- `banq-completion.bash` (shell completions)

These should be derived from a single registry to prevent drift.

#### `args.rest` mutation via `shift()`

The `args.rest` array is consumed destructively via `shift()` in both the dispatcher and individual arg parsers. While functional, this makes the code harder to reason about and debug because the args array is modified as a side effect across multiple call sites.

---

## Security

### Good Practices

- **Private key is never logged or displayed**: Wallet code reads the key from env and passes it directly to ethers.js. No intermediate logging.
- **Dry-run default**: Prevents accidental transactions.
- **`.env` files in `.gitignore`**: Private keys aren't committed (verified by `.gitignore` patterns).
- **Ledger support**: Hardware wallet option avoids private key exposure entirely.

### Concerns

- **`wallet/index.ts:34-38` generates random keys silently**: When `with_pk=true` and no `PRIVATE_KEY` is set, a random key is generated. This is used for read-only operations, but the behavior is implicit. A user might not realize they're operating with a random (and therefore useless for real transactions) wallet.

- **`PRIVATE_KEY` in environment**: Standard practice for CLI tools but worth noting. The `.env` file approach means the key sits on disk in plaintext. The Ledger integration mitigates this for production use.

- **No input validation on contract addresses from env**: The `env/oracles.ts` module asserts addresses are non-zero but doesn't validate checksum or format. A malformed address could cause silent failures.

- **Global JSON.parse mutation** (`function/json.ts`): The module monkey-patches `JSON.parse` globally at import time to handle BigInt serialization (`"123n"` strings). This affects all code in the process, could conflict with third-party libraries, and is imported as a side-effect module. A dedicated `parseBigIntJson()` function would be safer.

---

## Testing

### Coverage

- **26 test files** with co-located tests (good pattern).
- Tests cover argument parsing, validation, and dry-run paths thoroughly.
- Both positive and negative cases are tested (valid inputs and error messages).

### Gaps

- **No integration tests**: All tests exercise dry-run mode only (`broadcast: false`). There are no tests for actual contract interactions, even against a mock/fork.
- **No POW logic tests**: The proof-of-work functions in `pow/index.ts` and `pow/miner.ts` have no test files.
- **No wallet tests**: No tests for wallet creation, provider selection, or Ledger initialization.
- **No `env/` tests**: The `find-by.ts` address resolution logic (regex-based env var parsing) is untested.

### Test Environment

The CI pipeline uses `--env=./etc/banq/banq.env.testnet --env=.env.testnet` which provides real testnet addresses. This is appropriate for dry-run tests but means the test suite depends on env file presence.

---

## Code Quality

### Type Safety

- **`Result = Argument | null`** where `Argument = string | number | bigint | boolean` — this is very broad. A more specific result type per command would improve type safety.
- **`CommandResult = [Argument[], Result[]]`** tuples are loosely typed. The actual content varies by command (some return amounts, some return addresses, some return booleans).

### Duplicated Patterns

- **`list_options` blocks**: Every command has a nearly identical block printing available options and calling `Deno.exit(0)`. This could be extracted into a declarative options metadata per command.
- **POW integration**: The proof-of-work flow (check difficulty, encode ABI, call `pow()`) is duplicated across `supply-tokens.ts`, `borrow-tokens.ts`, `apow-claim.ts`, and `apow-claim-batch.ts`.
- **Error handling try-catch**: The `try { await CONTRACT.method(...) } catch (e) { if (isCallException(e)) ... throw e; }` pattern is repeated in every command. A wrapper function would reduce boilerplate.

### Minor Issues

- **`pow/index.ts:53` resolve race**: `hasher.reduce()` is called, then `resolve(-1n)` is called immediately after. This relies on the WASM callback calling `resolve()` before the synchronous `resolve(-1n)`. If `hasher.reduce()` is truly async, this is fine; if it's synchronous, the `-1n` would never fire. The pattern is fragile.
- **`retwap-oracle.ts:169` infinite promise**: `return await new Promise(() => {})` keeps the process alive for `--watch` mode. This is functional but means no graceful shutdown path exists.
- **`banq-main.ts:109` JSON output inconsistency**: `json()` wraps string results in `[result]` but boolean `true` becomes `["OK"]`. The mapping is lossy for consumers parsing JSON output.

---

## Dependencies

| Dependency | Version | Purpose | Notes |
|---|---|---|---|
| ethers | ^6.16.0 | Blockchain interaction | Mature, well-maintained |
| @ledgerhq/hw-app-eth | ^7.4.0 | Hardware wallet | Only works in dev mode (native modules) |
| @blackhan-software/wasm-miner | ^1.0.15 | POW mining | Internal package |
| decimal.js | ^10.6.0 | Precise arithmetic | Used in rate calculations |
| @std/assert | ^1.0.14 | Assertions | Deno standard library |
| @std/cli | ^1.0.22 | CLI parsing | Deno standard library |
| @std/dotenv | ^0.225.5 | Env file loading | Deno standard library |

The dependency set is minimal and appropriate. No unnecessary packages.

---

## Recommendations Summary

| Priority | Issue | Location |
|---|---|---|
| **High** | Add missing `throw e` in catch blocks | `refresh-oracle.ts:66`, `retwap-oracle.ts:212` |
| **High** | Fix regex double `$$` in `opt-at.ts` | `arg/opt-at.ts:15` |
| **High** | Convert `largeRandom()` recursion to loop | `xpow-mine.ts:155-161` |
| **Medium** | Replace if-else dispatch with command map | `banq.ts:34-104` |
| **Medium** | Unify command registry (dispatch, help, completions) | `banq.ts`, `banq-main.ts`, `banq-completion.bash` |
| **Medium** | Add tests for `pow/`, `wallet/`, `env/` modules | Missing test files |
| **Medium** | Extract shared POW flow into reusable function | `supply-tokens.ts`, `borrow-tokens.ts`, `apow-claim*.ts` |
| **Low** | Extract `list_options` into declarative metadata | All command files |
| **Low** | Tighten `Result` type per command | `cmd/types.ts` |
| **Low** | Add graceful shutdown for `--watch` mode | `retwap-oracle.ts:169` |
| **Low** | Make `rhs_of()` error handling consistent with `lhs_of()` | `retwap-oracle.ts:234-243` |
| **Low** | Replace global `JSON.parse` monkey-patch with explicit function | `function/json.ts` |
