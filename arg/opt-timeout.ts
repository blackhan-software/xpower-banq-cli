import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError } from "./types.ts";

export function opt_timeout(
  args?: Partial<Pick<BanqArgs, "timeout">>,
): number {
  const arg = args?.timeout ?? Infinity;
  if (typeof arg === "number" && arg >= 0) {
    return arg;
  }
  throw new ArgumentError(`invalid timeout: ${arg}`);
}
