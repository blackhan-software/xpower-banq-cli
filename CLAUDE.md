# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

XPower Banq CLI is a command-line interface for lending and borrowing XPOW and APOW tokens on the Avalanche blockchain. It includes position management, oracle operations, interest rate queries, and XPOW mining/minting capabilities.

## Technology Stack

- **Runtime**: Deno v2.0.0+ (TypeScript-based)
- **Blockchain**: Avalanche C-Chain (using ethers.js v6)
- **Hardware Wallet**: Ledger hardware wallet support via `@ledgerhq/hw-app-eth`
- **WASM Mining**: Uses `@blackhan-software/wasm-miner` for proof-of-work mining

## Development Commands

### Running the CLI
```sh
deno run -A --env=.env ./cli/banq/banq-main.ts
```

### Testing
```sh
deno test -A                                    # run all tests (--env=.env is loaded automatically)
deno test -A cmd/banq/supply-tokens.test.ts     # run specific test file
```

### Linting
```sh
deno lint
```

### Formatting
```sh
deno fmt
```

### Building Distributables
```sh
deno run build-banq --network=mainnet  # build for current platform
deno run build-banq --network=testnet  # build testnet version
```

The build system uses `build-banq.ts` to detect the current platform and invoke platform-specific tasks from `deno.json`. Each build task compiles with the appropriate `.env.mainnet` or `.env.testnet` file embedded via `--env` flag. Individual build tasks are available in `deno.json` for specific platforms (Linux x86_64/aarch64, macOS x86_64/aarch64, Windows x86_64) and networks (mainnet/testnet).

## Architecture

### Core Structure

- **`cli/banq/`**: CLI entry point and command routing
  - `banq-main.ts` - Main entry point with command dispatch loop
  - `banq.ts` - Command router using async generator pattern
  - `banq-args.ts` - Argument parsing logic

- **`cmd/banq/`**: Command implementations (supply, borrow, settle, redeem, liquidate, etc.)
  - Each command is self-contained with its own test file
  - Commands interact with smart contracts via ethers.js
  - ABIs are stored in `cmd/banq/abi/`

- **`arg/`**: Argument and option parsers
  - Modular parsers for different argument types (address, amount, token, etc.)
  - Option parsers for flags (--pool, --oracle, --gas, --ledger, etc.)

- **`env/`**: Environment-based configuration
  - `oracles.ts` - Loads oracle contract addresses (T000-T006) from environment variables
  - `find-by.ts` - Bidirectional lookup utilities: `address_by(prefix, suffix)` to find addresses, `prefix_by(address)` and `suffix_by(address)` to identify tokens/pools from addresses
  - Token/pool addresses are loaded directly from env vars (see Configuration below)

- **`wallet/`**: Wallet abstraction layer
  - `pk-wallet.ts` - Private key wallet (from env or random)
  - `hw-ledger-wallet.ts` - Ledger hardware wallet support
  - `index.ts` - Unified wallet interface

- **`function/`**: Utility functions
  - Address formatting, type conversions, JSON handling, sleep/timeout helpers

- **`pow/`**: Proof-of-work mining logic for XPOW

### Configuration

Environment variables are loaded from `.env` (symlinked to either `.env.mainnet` or `.env.testnet`):
- `PROVIDER_URL` - Avalanche RPC endpoint
- `PRIVATE_KEY` - Optional user private key (not needed for Ledger)
- `CONTRACT_RUN` - Contract version selector (v10a, v10b, etc.) - optional, used to select contract version
- Token addresses (versioned): `APOW_ADDRESS_v10a`, `XPOW_ADDRESS_v10a`, `AVAX_ADDRESS_v10a`, `USDC_ADDRESS_v10a`, `USDT_ADDRESS_v10a` (and v10b variants)
- Pool addresses (versioned): `P000_ADDRESS_v10a` through `P006_ADDRESS_v10b` (7 pools total)
- Oracle addresses (versioned): `T000_ADDRESS_v10a` through `T006_ADDRESS_v10b` (7 oracles total)

The versioning system allows multiple contract versions to coexist. The `CONTRACT_RUN` env var or `--contract-run` flag selects which version to use. The `find-by.ts` module uses regex patterns to extract prefixes (e.g., "P000", "APOW") and suffixes (e.g., "v10a") from env var names for dynamic address resolution.

### Command Pattern

All commands follow this pattern:
1. Parse arguments using modular parsers from `arg/`
2. Create wallet/signer using `wallet/index.ts`
3. Interact with smart contracts using ethers.js Contract instances
4. Return results as `[Argument[], Result[]]` tuples
5. Support `--broadcast` flag for transaction execution (dry-run by default)

### Key Design Patterns

- **Async Generators**: Main CLI loop uses async generators for command streaming
- **Command Aliases**: Each command has a short alias (e.g., `su` for `supply`, `bo` for `borrow`)
- **Dry-run by Default**: Transactions require explicit `--broadcast` or `-Y` flag
- **Hardware Wallet Limitation**: Ledger support only works when running from project directory (not from compiled binary) due to native Node module limitations

## Testing Notes

- Tests are co-located with implementation files (e.g., `supply-tokens.test.ts` next to `supply-tokens.ts`)
- Tests automatically load `.env` file via `import "../function/dotenv.ts"` at the top of most modules
- Run with `deno test -A` (no need to specify `--env=.env` flag)
- To run a specific test: `deno test -A cmd/banq/supply-tokens.test.ts`
- Ensure `.env` is symlinked to the correct network file (`.env.mainnet` or `.env.testnet`) before testing

## Important Implementation Details

### Wallet Creation
The wallet system supports two modes:
- Private key wallet: Uses `PRIVATE_KEY` env var or generates random key
- Ledger hardware wallet: Use `--ledger` or `-l` flag (only works in dev mode)

### Contract Interaction
All contract interactions use ethers.js v6 with:
- Token contracts using ERC-20 ABI (`cmd/banq/abi/erc20-abi.json`)
- Pool contracts using custom Pool ABI (`cmd/banq/abi/pool-abi.json`)

### Transaction Broadcasting
Commands support `--broadcast` (`-Y`) flag to actually submit transactions. Without this flag, commands perform read-only operations or simulations.
