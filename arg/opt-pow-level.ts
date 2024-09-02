import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError } from "./types.ts";

export function opt_pow_level(
  args?: Partial<Pick<BanqArgs, "pow_level">>,
): {
  pow_level: number;
} {
  const arg = args?.pow_level ?? 8;
  if (typeof arg === "number" && arg >= 0 && arg <= 64) {
    if (Number.isInteger(arg)) return { pow_level: arg };
  }
  throw new ArgumentError(`invalid pow-level: ${arg}`);
}
