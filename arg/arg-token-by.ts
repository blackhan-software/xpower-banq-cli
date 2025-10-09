import { address_by, prefix_by } from "../env/find-by.ts";
import { type Argument, ArgumentError } from "./types.ts";

export function arg_token_by(
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
      const address = address_by(symbol);
      if (address !== undefined) {
        return { address, symbol };
      }
    }
    throw new ArgumentError(`invalid token: ${arg}`);
  }
  // find token-symbol by address
  if (typeof arg === "bigint") {
    const symbol = prefix_by(arg);
    if (symbol === ref_symbol.toUpperCase()) {
      return { address: arg, symbol };
    }
    throw new ArgumentError(`invalid token: ${arg}`);
  }
  // find token-address by ref. symbol
  if (typeof arg === "undefined") {
    const address = address_by(ref_symbol);
    if (address !== undefined) {
      const symbol = prefix_by(address);
      if (symbol === ref_symbol.toUpperCase()) {
        return { address, symbol };
      }
      throw new ArgumentError(`invalid token: ${arg}`);
    }
  }
  throw new ArgumentError(`invalid token: ${arg}`);
}
