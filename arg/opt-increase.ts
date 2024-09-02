import type { BanqArgs } from "../cli/banq/banq.ts";

export function opt_increase(
  args?: Partial<Pick<BanqArgs, "inc" | "increase">>,
): {
  increase: boolean;
} {
  if (args?.inc || args?.increase) {
    return { increase: true };
  }
  return { increase: false };
}
