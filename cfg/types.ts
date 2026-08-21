import type { RunVersion } from "../arg/types.ts";

/**
 * Typed configuration tree, parsed from `yml/banq.{net}.yaml` layers.
 *
 * All contract addresses and hex literals MUST be quoted in YAML; an
 * unquoted `0x…` scalar is coerced to a number by the YAML parser, which
 * drops leading zeros/casing and fails validation in `cfg/load.ts`.
 */
export interface Config {
  /** RPC endpoints for the provider pool (was `PROVIDER_URL`). */
  provider: {
    urls: string[];
  };
  /** Default contract-run for address resolution (was `CONTRACT_RUN`). */
  contract_run?: RunVersion;
  /** Signer defaults (was `PRIVATE_KEY` / `HD_PATH`). */
  accounts?: {
    private_key?: string;
    hd_path?: string;
  };
  /** Static on-chain addresses, keyed by run version. */
  contracts: {
    /** Default caps address per run (P000–P006). */
    caps: Partial<Record<RunVersion, string>>;
    /** Per-pool caps overrides (e.g. P007), keyed by pool name then run. */
    pool_caps: Record<string, Partial<Record<RunVersion, string>>>;
    pools: Record<string, Partial<Record<RunVersion, string>>>;
  };
  /** Role labels → address, folded from `.env.contacts` (`{ROLE}_ADDRESS`). */
  contacts?: Record<string, string>;
}
