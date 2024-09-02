import { ethers } from "ethers";

import { ArgumentError, type RunVersion } from "../arg/types.ts";
import { pool_abi } from "../cmd/banq/abi/abis.ts";
import TOKEN_ABI from "../cmd/banq/abi/erc20-abi.json" with { type: "json" };
import { addressOf } from "../function/address.ts";
import { as_bigint } from "../function/as-bigint.ts";
import { address_by } from "./find-by.ts";
import { set_registry_reverse } from "./registry-reverse.ts";

/**
 * On-chain discovery registry: maps CLI names to contract addresses for the
 * current `(chainId, run)`. Only CAPS and the pool entry-points remain static
 * (in env); tokens, oracles and ACMA are discovered from the deployed pools.
 */
export type Registry = {
  /** CLI symbol (normalized) -> token address */
  tokens: Map<string, bigint>;
  /** address -> CLI symbol / name (reverse, for display) */
  byAddress: Map<bigint, string>;
  /** oracle name ("T000"…) -> address */
  oracles: Map<string, bigint>;
  /** access-manager address (from `pool.authority()`) */
  acma: bigint;
  /** static pool name ("P000"…) -> address (from env) */
  pools: Map<string, bigint>;
  /** static CAPS address (from env) */
  caps: bigint;
};

const MEMO = new Map<string, Promise<Registry>>();

/**
 * Discover and memoize the registry for a `(chainId, run)` pair.
 *
 * - pools are enumerated from static env (`P{id}_ADDRESS_{run}` keys);
 * - for each pool: `tokens()` (with normalized `symbol()`), `oracle()`,
 *   `authority()` are fetched from the deployed contract;
 * - `.env.contacts` labels are folded into the reverse map;
 * - per-pool failures are skipped (best-effort); throws only if no pool
 *   resolves.
 */
export function discover(
  provider: ethers.Provider,
  run: RunVersion,
): Promise<Registry> {
  return provider.getNetwork().then((network) => {
    const key = `${network.chainId}:${run}`;
    let promise = MEMO.get(key);
    if (promise === undefined) {
      promise = build(provider, run);
      MEMO.set(key, promise);
    }
    return promise;
  });
}
/**
 * Clear the discovery memo (test hygiene).
 */
export function discover_clear(): void {
  MEMO.clear();
}

async function build(
  provider: ethers.Provider,
  run: RunVersion,
): Promise<Registry> {
  const tokens = new Map<string, bigint>();
  const byAddress = new Map<bigint, string>();
  const oracles = new Map<string, bigint>();
  const pools = new Map<string, bigint>();
  let acma = 0n;
  let caps = 0n;
  let resolved = 0;

  const caps_addr = address_by("CAPS", run);
  if (caps_addr !== undefined) {
    caps = caps_addr;
    byAddress.set(caps_addr, "CAPS");
  }
  // per-pool CAPS overrides (e.g. `{POOL}_CAPS_ADDRESS_{run}`) for reverse
  // labeling — same "CAPS" display name as the shared default
  const pool_caps_rx = new RegExp(`^P\\d+_CAPS_ADDRESS_${run}$`);
  for (const [key, value] of Object.entries(Deno.env.toObject())) {
    if (!pool_caps_rx.test(key)) continue;
    const caps_override = as_bigint(value);
    if (caps_override !== undefined) byAddress.set(caps_override, "CAPS");
  }
  const pool_rx = new RegExp(`^P\\d+_ADDRESS_${run}$`);
  for (const [key, value] of Object.entries(Deno.env.toObject())) {
    if (!pool_rx.test(key)) {
      continue;
    }
    const name = key.slice(0, key.indexOf("_"));
    const pool_addr = as_bigint(value);
    if (pool_addr === undefined) {
      continue;
    }
    pools.set(name, pool_addr);
    byAddress.set(pool_addr, name);
    try {
      const POOL = new ethers.Contract(
        addressOf(pool_addr),
        pool_abi(run),
        provider,
      );
      const [token_addrs, oracle_addr, authority] = await Promise.all([
        POOL.tokens(),
        POOL.oracle(),
        POOL.authority(),
      ]);
      const token_names = await Promise.all(
        (token_addrs as string[]).map(async (addr) => {
          const TOKEN = new ethers.Contract(addr, TOKEN_ABI, provider);
          return { addr: BigInt(addr), symbol: await symbolOf(TOKEN) };
        }),
      );
      for (const { addr, symbol } of token_names) {
        if (!tokens.has(symbol)) {
          tokens.set(symbol, addr);
        }
        if (!byAddress.has(addr)) {
          byAddress.set(addr, symbol);
        }
      }
      const oname = `T${name.slice(1)}`;
      oracles.set(oname, BigInt(oracle_addr));
      byAddress.set(BigInt(oracle_addr), oname);
      if (acma === 0n && BigInt(authority) !== 0n) {
        acma = BigInt(authority);
        byAddress.set(acma, "ACMA");
      }
      resolved += 1;
    } catch {
      // best-effort: skip failing pool
    }
  }
  // fold in `.env.contacts` reverse-lookup labels
  for (const [k, v] of Object.entries(Deno.env.toObject())) {
    if (k.endsWith("_ADDRESS")) {
      const addr = as_bigint(v);
      if (addr !== undefined) {
        byAddress.set(addr, k.slice(0, -"_ADDRESS".length));
      }
    }
  }
  if (resolved === 0) {
    throw new Error("no pool resolved");
  }
  const registry: Registry = {
    tokens,
    byAddress,
    oracles,
    acma,
    pools,
    caps,
  };
  set_registry_reverse(byAddress);
  return registry;
}

/**
 * Explicit CLI-symbol overrides for ERC20 `symbol()` results.
 *
 * Single code-patch resolving the `[W]AVAX` mismatch: wrapped AVAX returns
 * `symbol() === "WAVAX"` while the CLI label is `AVAX`. Unlike a blanket
 * leading-`W` strip (which would corrupt e.g. `WBTC`), only known symbols
 * are rewritten, keeping `tokens` and `byAddress` consistent in both
 * directions. `APOW`, `XPOW`, `USDC`, `USDT` are unaffected.
 */
const SYMBOL_OVERRIDES: Record<string, string> = {
  WAVAX: "AVAX",
};
/**
 * @returns the CLI symbol for an ERC20 token, with known overrides applied
 */
export function symbolOf(token: ethers.Contract): Promise<string> {
  return token.symbol().then((s: string) => SYMBOL_OVERRIDES[s] ?? s);
}

/**
 * @returns address of the given CLI token symbol (throws if not discovered)
 */
export function resolve_token(symbol: string, reg: Registry): bigint {
  const addr = reg.tokens.get(symbol);
  if (addr === undefined) {
    throw new ArgumentError(`invalid token: ${symbol}`);
  }
  return addr;
}
/**
 * @returns address of the given oracle name (throws if not discovered)
 */
export function resolve_oracle(name: string, reg: Registry): bigint {
  const addr = reg.oracles.get(name);
  if (addr === undefined) {
    throw new ArgumentError(`invalid oracle: ${name}`);
  }
  return addr;
}
/**
 * @returns CLI symbol/name for the given address (throws if not discovered)
 */
export function resolve_symbol(address: bigint, reg: Registry): string {
  const symbol = reg.byAddress.get(address);
  if (symbol === undefined) {
    throw new ArgumentError(`invalid token: ${addressOf(address)}`);
  }
  return symbol;
}
/**
 * Resolve a token parsed offline (symbol or raw address) against the registry.
 */
export function resolve_arg_token(
  parsed: { address: bigint; symbol: string },
  reg: Registry,
): { address: bigint; symbol: string } {
  if (parsed.symbol !== "") {
    return {
      address: resolve_token(parsed.symbol, reg),
      symbol: parsed.symbol,
    };
  }
  return {
    address: parsed.address,
    symbol: resolve_symbol(parsed.address, reg),
  };
}
/**
 * Resolve an oracle parsed offline (name or raw address) against the registry.
 */
export function resolve_arg_oracle(
  parsed: { address: bigint; name: string },
  reg: Registry,
): { address: bigint; name: string } {
  if (parsed.name !== "") {
    return { address: resolve_oracle(parsed.name, reg), name: parsed.name };
  }
  const name = reg.byAddress.get(parsed.address);
  if (name === undefined) {
    throw new ArgumentError(`invalid oracle: ${addressOf(parsed.address)}`);
  }
  return { address: parsed.address, name };
}
