import { address_by, prefix_by } from "../env/find-by.ts";
import { type Argument, ArgumentError } from "./types.ts";

export function arg_token(
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
    const symbol = arg.toUpperCase();
    const address = address_by(symbol);
    if (address !== undefined) {
      return { address, symbol };
    }
  }
  // find token-symbol by address
  if (typeof arg === "bigint") {
    const symbol = prefix_by(arg);
    if (symbol !== undefined) {
      return { address: arg, symbol };
    }
  }
  throw new ArgumentError(`invalid token: ${arg}`);
}
