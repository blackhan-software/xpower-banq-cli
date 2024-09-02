import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError } from "./types.ts";

export function opt_digits(
  args?: Partial<Pick<BanqArgs, "digits">>,
): number {
  const arg = args?.digits ?? 2;
  if (typeof arg === "number" && arg >= 0) {
    if (Number.isInteger(arg)) {
      return arg;
    }
  }
  throw new ArgumentError(`invalid digits: ${arg}`);
}
