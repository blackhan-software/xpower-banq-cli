import type { BanqArgs } from "../cli/banq/banq.ts";
import { address_by, prefix_by } from "../env/find-by.ts";
import { opt_contract_run } from "./opt-contract-run.ts";
import { type Argument, ArgumentError } from "./types.ts";

export function arg_token(
  args: Partial<Pick<BanqArgs, "contract_run">>,
  rest: Argument[],
): {
  address: bigint;
  symbol: string;
} {
  const { contract_run } = opt_contract_run(args);
  const arg = rest.shift();
  if (typeof arg === "undefined") {
    throw new ArgumentError("insufficient arguments");
  }
  // find token-address by symbol
  if (typeof arg === "string") {
    const symbol = arg.toUpperCase();
    const address = address_by(symbol, contract_run);
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
