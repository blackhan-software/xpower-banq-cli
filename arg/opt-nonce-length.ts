import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError } from "./types.ts";

export function opt_nonce_length(
  args?: Partial<Pick<BanqArgs, "nonce_length">>,
): {
  nonce_length: number;
} {
  const arg = args?.nonce_length ?? 8;
  if (typeof arg === "number" && arg >= 0) {
    if (Number.isInteger(arg)) return { nonce_length: arg };
  }
  throw new ArgumentError(`invalid nonce-length: ${arg}`);
}
