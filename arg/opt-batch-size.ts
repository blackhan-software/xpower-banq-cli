import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError } from "./types.ts";

export function opt_batch_size(
  args?: Partial<Pick<BanqArgs, "batch_size">>,
): {
  batch_size: number;
} {
  const arg = args?.batch_size ?? 1;
  const batch_size = typeof arg === "string" ? Number(arg) : arg;
  if (typeof batch_size === "number" && batch_size >= 1) {
    if (Number.isInteger(batch_size)) return { batch_size };
  }
  throw new ArgumentError(`invalid batch-size: ${arg}`);
}
