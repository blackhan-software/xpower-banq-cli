import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError } from "./types.ts";

export function opt_gas_limit(
  args?: Partial<Pick<BanqArgs, "gas_limit">>,
): {
  gas_limit?: number;
} {
  const arg = args?.gas_limit;
  if (typeof arg === "number") {
    return { gas_limit: arg };
  }
  if (typeof arg === "string") {
    try {
      return { gas_limit: Number(arg) };
    } catch (_) {
      throw new ArgumentError(`invalid gas-limit: ${arg}`);
    }
  }
  return { gas_limit: undefined };
}
export function opt_max_fee_per_gas(
  args?: Partial<Pick<BanqArgs, "max_fee_per_gas">>,
): {
  max_fee_per_gas?: number;
} {
  const arg = args?.max_fee_per_gas;
  if (typeof arg === "number") {
    return { max_fee_per_gas: arg };
  }
  if (typeof arg === "string") {
    try {
      return { max_fee_per_gas: Number(arg) };
    } catch (_) {
      throw new ArgumentError(`invalid max-fee-per-gas: ${arg}`);
    }
  }
  return { max_fee_per_gas: undefined };
}
export function opt_max_priority_fee_per_gas(
  args?: Partial<Pick<BanqArgs, "max_priority_fee_per_gas">>,
): {
  max_priority_fee_per_gas?: number;
} {
  const arg = args?.max_priority_fee_per_gas;
  if (typeof arg === "number") {
    return { max_priority_fee_per_gas: arg };
  }
  if (typeof arg === "string") {
    try {
      return { max_priority_fee_per_gas: Number(arg) };
    } catch (_) {
      throw new ArgumentError(`invalid max-priority-fee-per-gas: ${arg}`);
    }
  }
  return { max_priority_fee_per_gas: undefined };
}
