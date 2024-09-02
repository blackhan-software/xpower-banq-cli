import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError } from "./types.ts";

/**
 * Parse an oracle argument offline: extract the name without resolving any
 * address. Resolution happens after wallet + on-chain discovery in broadcast
 * mode (`resolve_arg_oracle`); dry-run never requires an address.
 */
export function opt_oracle(
  args?: Partial<Pick<BanqArgs, "contract_run" | "oracle">>,
): {
  address: bigint;
  name: string;
} {
  const arg = args?.oracle ?? "T000";
  // find oracle-address by name
  if (typeof arg === "string") {
    return { address: 0n, name: arg.toUpperCase() };
  }
  // find oracle-name by address
  if (typeof arg === "bigint") {
    return { address: arg, name: "" };
  }
  throw new ArgumentError(`invalid oracle: ${arg}`);
}
