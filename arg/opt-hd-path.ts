import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError } from "./types.ts";
const HD_REGEX = /^m(\/\d+'?)+$/;

export function opt_hd_path(
  args?: Partial<Pick<BanqArgs, "hd_path">>,
): string {
  const arg = args?.hd_path ??
    Deno.env.get("HD_PATH") ??
    "m/44'/60'/0'/0/0";
  if (HD_REGEX.test(arg)) {
    return arg;
  }
  throw new ArgumentError(`invalid hd-path: ${arg}`);
}
