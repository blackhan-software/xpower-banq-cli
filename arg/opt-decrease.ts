import type { BanqArgs } from "../cli/banq/banq.ts";

export function opt_decrease(
  args?: Partial<Pick<BanqArgs, "dec" | "decrease">>,
): {
  decrease: boolean;
} {
  if (args?.dec || args?.decrease) {
    return { decrease: true };
  }
  return { decrease: false };
}
