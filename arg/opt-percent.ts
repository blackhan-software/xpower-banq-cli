import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError } from "./types.ts";

export function opt_percent(
  args?: Partial<Pick<BanqArgs, "percent">>,
): number {
  const arg = args?.percent ?? 0;
  if (typeof arg === "number" && arg >= 0) {
    return arg / 100.0;
  }
  throw new ArgumentError(`invalid percent: ${arg}`);
}
export function opt_percent_min(
  args?: Partial<Pick<BanqArgs, "percent_min">>,
): number {
  const arg = args?.percent_min ?? 3;
  if (typeof arg === "number" && arg >= 0) {
    return arg / 100.0;
  }
  throw new ArgumentError(`invalid percent-min: ${arg}`);
}
export function opt_percent_max(
  args?: Partial<Pick<BanqArgs, "percent_max">>,
): number {
  const arg = args?.percent_max ?? 100;
  if (typeof arg === "number" && arg >= 0) {
    return arg / 100.0;
  }
  throw new ArgumentError(`invalid percent-max: ${arg}`);
}
