import type { BanqArgs } from "../cli/banq/banq.ts";
import { type Argument, ArgumentError } from "./types.ts";

/**
 * Parse a token argument offline: extract the symbol string without resolving
 * any address. Resolution happens after wallet + on-chain discovery in
 * broadcast mode (`resolve_arg_token`); dry-run never requires an address.
 */
export function arg_token(
  _args: Partial<Pick<BanqArgs, "contract_run">>,
  rest: Argument[],
): {
  address: bigint;
  symbol: string;
} {
  const arg = rest.shift();
  if (typeof arg === "undefined") {
    throw new ArgumentError("insufficient arguments");
  }
  // find token-address by symbol
  if (typeof arg === "string") {
    return { address: 0n, symbol: arg.toUpperCase() };
  }
  // find token-symbol by address
  if (typeof arg === "bigint") {
    return { address: arg, symbol: "" };
  }
  throw new ArgumentError(`invalid token: ${arg}`);
}
