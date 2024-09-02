import { ethers } from "ethers";
import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError } from "../cmd/types.ts";
import { bigint2hex } from "./parser.ts";

export function opt_to(
  args?: Partial<Pick<BanqArgs, "to">>,
): {
  address: bigint;
} {
  const arg = args?.to;
  if (typeof arg === "undefined") {
    return { address: 0n };
  }
  if (typeof arg !== "bigint" || arg < 0x0n) {
    throw new ArgumentError(`invalid address: ${arg}`);
  }
  const [hex] = bigint2hex([arg], 40);
  if (!ethers.isAddress(hex)) {
    throw new ArgumentError(`invalid address: ${arg}`);
  }
  return { address: arg };
}
