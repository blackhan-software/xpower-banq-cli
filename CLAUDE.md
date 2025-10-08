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
deno test -A
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
deno run build-banq  # builds for all platforms (Linux, macOS, Windows x86_64)
```

Individual build tasks are available in `deno.json` for specific platforms and networks (mainnet/testnet).

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
  - `tokens.ts` - Token contract addresses (APOW, XPOW, AVAX, USDC, USDT)
  - `pools.ts` - Pool contract addresses (P000-P003)
  - `oracles.ts` - Oracle contract addresses (T000-T003)
  - `find-by.ts` - Helper to look up addresses by identifier

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
- Token addresses: `APOW_ADDRESS`, `XPOW_ADDRESS`, `AVAX_ADDRESS`, `USDC_ADDRESS`, `USDT_ADDRESS`
- Pool addresses: `P000_ADDRESS` through `P003_ADDRESS`
- Oracle addresses: `T000_ADDRESS` through `T003_ADDRESS`

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
- Tests use `.env` file for configuration
- Run with `deno test -A --env=.env`

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

## Known Issues

Ledger hardware wallet support requires running from source due to Deno's limited support for native Node modules (`node-hid`, `keccak`, `usb`). The compiled binary does not support Ledger.
