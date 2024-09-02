import type { BanqArgs } from "../cli/banq/banq.ts";
import { type Argument, ArgumentError } from "./types.ts";

/**
 * Parse a token argument offline against a reference symbol (e.g. `XPOW`).
 * Only the symbol string is extracted; the address is resolved after wallet +
 * on-chain discovery in broadcast mode (`resolve_arg_token`).
 */
export function arg_token_by(
  _args: Partial<Pick<BanqArgs, "contract_run">>,
  rest: Argument[],
  ref_symbol: string,
): {
  address: bigint;
  symbol: string;
} {
  const arg = rest.shift();
  // find token-address by symbol
  if (typeof arg === "string") {
    const symbol = arg.toUpperCase();
    if (symbol === ref_symbol.toUpperCase()) {
      return { address: 0n, symbol };
    }
    throw new ArgumentError(`invalid token: ${arg}`);
  }
  // find token-symbol by address
  if (typeof arg === "bigint") {
    return { address: arg, symbol: "" };
  }
  // find token-address by ref. symbol
  if (typeof arg === "undefined") {
    return { address: 0n, symbol: ref_symbol.toUpperCase() };
  }
  throw new ArgumentError(`invalid token: ${arg}`);
}
