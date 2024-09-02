import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError } from "./types.ts";

export type GasOptions = Partial<{
  maxPriorityFeePerGas: number;
  maxFeePerGas: number;
  gasLimit: number;
}>;

export function opt_gas(args: BanqArgs): GasOptions {
  const { maxPriorityFeePerGas } = opt_max_priority_fee_per_gas(args);
  const { maxFeePerGas } = opt_max_fee_per_gas(args);
  const { gasLimit } = opt_gas_limit(args);
  return {
    maxPriorityFeePerGas,
    maxFeePerGas,
    gasLimit,
  };
}
export function opt_gas_limit(
  args?: Partial<Pick<BanqArgs, "gas_limit">>,
): Pick<GasOptions, "gasLimit"> {
  return {
    gasLimit: opt_number(args?.gas_limit, "gas-limit"),
  };
}
export function opt_max_fee_per_gas(
  args?: Partial<Pick<BanqArgs, "max_fee_per_gas">>,
): Pick<GasOptions, "maxFeePerGas"> {
  return {
    maxFeePerGas: opt_number(args?.max_fee_per_gas, "max-fee-per-gas"),
  };
}
export function opt_max_priority_fee_per_gas(
  args?: Partial<Pick<BanqArgs, "max_priority_fee_per_gas">>,
): Pick<GasOptions, "maxPriorityFeePerGas"> {
  return {
    maxPriorityFeePerGas: opt_number(
      args?.max_priority_fee_per_gas,
      "max-priority-fee-per-gas",
    ),
  };
}
function opt_number(arg: unknown, label: string): number | undefined {
  if (typeof arg === "number") return arg;
  if (typeof arg === "string") {
    try {
      return Number(arg);
    } catch (_) {
      throw new ArgumentError(`invalid ${label}: ${arg}`);
    }
  }
  return undefined;
}
export default opt_gas;
