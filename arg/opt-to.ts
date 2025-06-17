import type { BanqArgs } from "../cli/banq/banq.ts";

export function opt_to(
  args?: Partial<Pick<BanqArgs, "to">>
): {
  address: bigint | undefined;
} {
  return { address: args?.to };
}
