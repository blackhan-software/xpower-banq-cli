import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError } from "./types.ts";

export function opt_nft_ids(
  args?: Partial<Pick<BanqArgs, "nft_id">>,
): number[] {
  const ids = [];
  const arg = args?.nft_id;
  if (typeof arg === "string") {
    for (const a of arg.split(",")) {
      const id = nftId(a);
      if (id) ids.push(id);
    }
  }
  if (typeof arg === "number") {
    const id = nftId(arg);
    if (id) ids.push(id);
  }
  if (ids.length > 0) {
    return ids;
  }
  throw new ArgumentError(`invalid nft-id: ${arg}`);
}
function nftId(
  a: number | string,
  base = 202100,
): number {
  const n = Number(a);
  if (!Number.isInteger(n)) {
    throw new ArgumentError(`invalid nft-id: ${a}`);
  }
  if (n < base || (n % 100) % 3 !== 0) {
    throw new ArgumentError(`invalid nft-id: ${a}`);
  }
  return n;
}
