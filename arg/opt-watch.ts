import type { BanqArgs } from "../cli/banq/banq.ts";

export function opt_watch(
  args?: Partial<Pick<BanqArgs, "watch">>,
): boolean {
  const arg = args?.watch;
  if (typeof arg === "boolean") {
    return arg;
  }
  return false;
}
