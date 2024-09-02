import type { BanqArgs } from "../cli/banq/banq.ts";
import { address_by, prefix_by } from "../env/find-by.ts";
import { as_number } from "../tool/as-number.ts";
import { ArgumentError } from "./types.ts";

export function opt_pool(
  args?: Partial<Pick<BanqArgs, "pool">>,
): {
  address: bigint;
  id: number;
} {
  const arg = args?.pool ?? 1;
  // find pool-address by id
  if (typeof arg === "number") {
    const address = address_by(`BNQ${arg}`);
    if (address !== undefined) {
      return { address, id: arg };
    }
  }
  // find pool-id by address
  if (typeof arg === "bigint") {
    const prefix = prefix_by(arg);
    if (prefix !== undefined) {
      const id = as_number(prefix.replace("BNQ", ""));
      if (id !== undefined) return { address: arg, id };
    }
  }
  throw new ArgumentError(`invalid pool: ${arg}`);
}
