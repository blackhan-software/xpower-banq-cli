import { parse } from "@std/yaml";

import { ArgumentError, type RunVersion } from "../arg/types.ts";
import type { Config } from "./types.ts";

const RUN_VERSIONS: RunVersion[] = ["v10b", "v10c", "v11a"];
const ADDRESS_RX = /^0x[0-9a-fA-F]{40}$/;
const HD_REGEX = /^m(\/\d+'?)+$/;

/**
 * Parse and validate a raw YAML document into a typed {@link Config}.
 *
 * Strict: requires `provider.urls` and `contracts` (base layer).
 *
 * @throws {ArgumentError} on structural or value violations. In particular,
 * unquoted `0x…` address scalars are coerced to numbers by the YAML parser
 * and are rejected with a message pointing at the quoting rule.
 */
export function validate_config(raw: unknown): Config {
  const obj = require_map(raw, "config");
  if (obj.contracts === undefined) {
    throw new ArgumentError("config: missing contracts");
  }
  return validate_sections(obj);
}

/**
 * Parse and validate a partial overlay document (local layer).
 *
 * Lenient: every top-level section is optional; absent sections default to
 * empty so a local file may override only what it sets.
 */
export function validate_overlay(raw: unknown): Config {
  return validate_sections(require_map(raw, "config"));
}

/**
 * Deep-merge a local overlay onto the base config.
 *
 * Semantics: mapping layers merge recursively; `provider.urls` and scalar
 * values are replaced (last layer wins).
 */
export function merge_config(base: Config, over: Config): Config {
  const pools: Config["contracts"]["pools"] = { ...base.contracts.pools };
  for (const [name, runs] of Object.entries(over.contracts.pools)) {
    pools[name] = { ...base.contracts.pools[name], ...runs };
  }
  const pool_caps: Config["contracts"]["pool_caps"] = {
    ...base.contracts.pool_caps,
  };
  for (const [name, runs] of Object.entries(over.contracts.pool_caps)) {
    pool_caps[name] = { ...base.contracts.pool_caps[name], ...runs };
  }
  return {
    provider: { urls: over.provider.urls },
    contract_run: over.contract_run ?? base.contract_run,
    accounts: {
      private_key: over.accounts?.private_key ?? base.accounts?.private_key,
      hd_path: over.accounts?.hd_path ?? base.accounts?.hd_path,
    },
    contracts: {
      caps: { ...base.contracts.caps, ...over.contracts.caps },
      pool_caps,
      pools,
    },
    contacts: { ...base.contacts, ...over.contacts },
  };
}

function validate_sections(obj: Record<string, unknown>): Config {
  const provider = obj.provider === undefined
    ? { urls: [] as string[] }
    : validate_provider(as_map(obj.provider, "provider"));

  let contract_run: RunVersion | undefined;
  if (obj.contract_run !== undefined) {
    if (
      typeof obj.contract_run !== "string" ||
      !RUN_VERSIONS.includes(obj.contract_run as RunVersion)
    ) {
      throw new ArgumentError(
        `config: invalid contract_run: ${obj.contract_run}`,
      );
    }
    contract_run = obj.contract_run as RunVersion;
  }

  let accounts: Config["accounts"];
  if (obj.accounts !== undefined) {
    const acct = as_map(obj.accounts, "accounts");
    if (
      acct.private_key !== undefined &&
      typeof acct.private_key !== "string"
    ) {
      throw new ArgumentError(
        "config: accounts.private_key must be a quoted string (0x…)",
      );
    }
    if (acct.hd_path !== undefined) {
      if (typeof acct.hd_path !== "string" || !HD_REGEX.test(acct.hd_path)) {
        throw new ArgumentError(`config: invalid accounts.hd_path`);
      }
    }
    accounts = {
      private_key: acct.private_key as string | undefined,
      hd_path: acct.hd_path as string | undefined,
    };
  }

  const caps: Config["contracts"]["caps"] = {};
  const pool_caps: Config["contracts"]["pool_caps"] = {};
  const pools: Config["contracts"]["pools"] = {};
  if (obj.contracts !== undefined) {
    const contracts = as_map(obj.contracts, "contracts");
    if (contracts.caps !== undefined) {
      const caps_raw = as_map(contracts.caps, "contracts.caps");
      for (const [key, val] of Object.entries(caps_raw)) {
        if (RUN_VERSIONS.includes(key as RunVersion)) {
          caps[key as RunVersion] = validate_address(
            val,
            `contracts.caps.${key}`,
          );
        } else {
          pool_caps[key] = validate_run_map(
            as_map(val, `contracts.caps.${key}`),
            `contracts.caps.${key}`,
          );
        }
      }
    }
    const pools_raw = as_map(contracts.pools, "contracts.pools");
    for (const [name, runs] of Object.entries(pools_raw)) {
      pools[name] = validate_run_map(
        as_map(runs, `contracts.pools.${name}`),
        `contracts.pools.${name}`,
      );
    }
  }

  let contacts: Config["contacts"];
  if (obj.contacts !== undefined) {
    contacts = validate_address_map(
      as_map(obj.contacts, "contacts"),
      "contacts",
    );
  }

  return {
    provider,
    contract_run,
    accounts,
    contracts: { caps, pool_caps, pools },
    contacts,
  };
}

function validate_provider(provider: Record<string, unknown>) {
  const urls_raw = provider.urls;
  if (!Array.isArray(urls_raw) || urls_raw.length === 0) {
    throw new ArgumentError("config: provider.urls must be a non-empty list");
  }
  const urls = urls_raw.map((u) => {
    if (typeof u !== "string" || !URL.canParse(u)) {
      throw new ArgumentError(`config: invalid provider url: ${u}`);
    }
    return u;
  });
  return { urls };
}

function require_map(value: unknown, path: string): Record<string, unknown> {
  return as_map(value, path);
}

function as_map(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ArgumentError(`config: ${path} must be a mapping`);
  }
  return value as Record<string, unknown>;
}

function validate_run_map(
  raw: Record<string, unknown>,
  path: string,
): Partial<Record<RunVersion, string>> {
  const out: Partial<Record<RunVersion, string>> = {};
  for (const [run, addr] of Object.entries(raw)) {
    if (!RUN_VERSIONS.includes(run as RunVersion)) {
      throw new ArgumentError(`config: ${path}.${run} is not a valid run`);
    }
    out[run as RunVersion] = validate_address(addr, `${path}.${run}`);
  }
  return out;
}

function validate_address(addr: unknown, path: string): string {
  if (typeof addr !== "string" || !ADDRESS_RX.test(addr)) {
    throw new ArgumentError(
      `config: ${path} must be a quoted 0x address`,
    );
  }
  return addr;
}

function validate_address_map(
  raw: Record<string, unknown>,
  path: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, addr] of Object.entries(raw)) {
    if (typeof addr !== "string" || !ADDRESS_RX.test(addr)) {
      throw new ArgumentError(
        `config: ${path}.${name} must be a quoted 0x address`,
      );
    }
    out[name] = addr;
  }
  return out;
}

/**
 * Load and merge the config layers for a network.
 *
 * Base: `yml/banq.{net}.yaml`; when `local` is true and
 * `yml/banq.{net}.local.yaml` exists it is deep-merged on top.
 */
export function load_config(
  network: "mainnet" | "testnet",
  opts: { local?: boolean; base_dir?: string } = {},
): Config {
  const { local = true, base_dir = "." } = opts;
  const base = validate_config(
    parse(read_file(`${base_dir}/yml/banq.${network}.yaml`)),
  );
  if (!local) {
    return base;
  }
  const local_path = `${base_dir}/yml/banq.${network}.local.yaml`;
  if (file_exists(local_path)) {
    return merge_config(
      base,
      validate_overlay(parse(read_file(local_path))),
    );
  }
  return base;
}

function read_file(path: string): string {
  try {
    return Deno.readTextFileSync(path);
  } catch (e) {
    throw new ArgumentError(`config: cannot read ${path}: ${message_of(e)}`);
  }
}

function file_exists(path: string): boolean {
  try {
    Deno.statSync(path);
    return true;
  } catch {
    return false;
  }
}

function message_of(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
