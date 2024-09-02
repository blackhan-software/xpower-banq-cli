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
  const arg = args?.gas_limit;
  if (typeof arg === "number") {
    return { gasLimit: arg };
  }
  if (typeof arg === "string") {
    try {
      return { gasLimit: Number(arg) };
    } catch (_) {
      throw new ArgumentError(`invalid gas-limit: ${arg}`);
    }
  }
  return { gasLimit: undefined };
}
export function opt_max_fee_per_gas(
  args?: Partial<Pick<BanqArgs, "max_fee_per_gas">>,
): Pick<GasOptions, "maxFeePerGas"> {
  const arg = args?.max_fee_per_gas;
  if (typeof arg === "number") {
    return { maxFeePerGas: arg };
  }
  if (typeof arg === "string") {
    try {
      return { maxFeePerGas: Number(arg) };
    } catch (_) {
      throw new ArgumentError(`invalid max-fee-per-gas: ${arg}`);
    }
  }
  return { maxFeePerGas: undefined };
}
export function opt_max_priority_fee_per_gas(
  args?: Partial<Pick<BanqArgs, "max_priority_fee_per_gas">>,
): Pick<GasOptions, "maxPriorityFeePerGas"> {
  const arg = args?.max_priority_fee_per_gas;
  if (typeof arg === "number") {
    return { maxPriorityFeePerGas: arg };
  }
  if (typeof arg === "string") {
    try {
      return { maxPriorityFeePerGas: Number(arg) };
    } catch (_) {
      throw new ArgumentError(`invalid max-priority-fee-per-gas: ${arg}`);
    }
  }
  return { maxPriorityFeePerGas: undefined };
}
export default opt_gas;
