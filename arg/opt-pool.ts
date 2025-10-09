import type { BanqArgs } from "../cli/banq/banq.ts";
import { address_by, prefix_by } from "../env/find-by.ts";
import { ArgumentError } from "./types.ts";

export function opt_pool(
  args?: Partial<Pick<BanqArgs, "pool">>,
): {
  address: bigint;
  name: string;
} {
  const arg = args?.pool ?? "P000";
  // find pool-address by name
  if (typeof arg === "string") {
    const name = arg.toUpperCase();
    const address = address_by(name);
    if (address !== undefined) {
      return { address, name };
    }
  }
  // find pool-id by address
  if (typeof arg === "bigint") {
    const name = prefix_by(arg);
    if (name !== undefined) {
      return { address: arg, name };
    }
  }
  throw new ArgumentError(`invalid pool: ${arg}`);
}
