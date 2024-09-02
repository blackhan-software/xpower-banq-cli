import type { BanqArgs } from "../cli/banq/banq.ts";
import { address_by, prefix_by } from "../env/find-by.ts";
import { opt_contract_run } from "./opt-contract-run.ts";
import { type Argument, ArgumentError } from "./types.ts";

export function arg_token_by(
  args: Partial<Pick<BanqArgs, "contract_run">>,
  rest: Argument[],
  ref_symbol: string,
): {
  address: bigint;
  symbol: string;
} {
  const { contract_run } = opt_contract_run(args);
  const arg = rest.shift();
  // find token-address by symbol
  if (typeof arg === "string") {
    const symbol = arg.toUpperCase();
    if (symbol === ref_symbol.toUpperCase()) {
      const address = address_by(symbol, contract_run);
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
    const address = address_by(ref_symbol, contract_run);
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
