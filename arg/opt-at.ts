import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError } from "./types.ts";

export function opt_at(
  args?: Partial<Pick<BanqArgs, "at">>,
): number | null {
  const arg = args?.at ?? null;
  if (arg === null) {
    return Infinity;
  }
  if (typeof arg === "string") {
    if (arg.match(/^now$/i) || arg.match(/^latest$/i)) {
      return null;
    }
    if (arg.match(/^all$$/i)) {
      return Infinity;
    }
  }
  if (typeof arg === "number") {
    if (Number.isInteger(arg)) {
      return arg;
    }
  }
  throw new ArgumentError(`invalid at: ${arg}`);
}
