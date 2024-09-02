import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError } from "./types.ts";

export function opt_retry(
  args?: Partial<Pick<BanqArgs, "retry" | "retry_gas_factor">>,
): {
  retry: number;
  retry_gas_factor: number;
} {
  const arg = args?.retry ?? 3;
  if (typeof arg !== "number" || arg < 1) {
    throw new ArgumentError(`invalid retry: ${arg}`);
  }
  return {
    retry: arg,
    retry_gas_factor: opt_retry_gas_factor(args),
  };
}
function opt_retry_gas_factor(
  args?: Partial<Pick<BanqArgs, "retry_gas_factor">>,
): number {
  const arg = args?.retry_gas_factor ?? 2;
  if (typeof arg === "number" && arg >= 1) {
    return arg;
  }
  throw new ArgumentError(`invalid retry-gas-factor: ${arg}`);
}
export default opt_retry;
