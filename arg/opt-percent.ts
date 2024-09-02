import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError } from "./types.ts";

export function opt_percent(
  args?: Partial<Pick<BanqArgs, "percent">>,
): number {
  const arg = args?.percent ?? 3;
  if (typeof arg === "number" && arg >= 0) {
    return arg / 100.0;
  }
  throw new ArgumentError(`invalid percent: ${arg}`);
}
