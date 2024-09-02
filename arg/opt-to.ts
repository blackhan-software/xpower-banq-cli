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
  if (typeof arg === "string") {
    if (ethers.isAddress(arg)) {
      return { address: BigInt(arg) };
    }
  }
  if (typeof arg === "bigint") {
    const [hex] = bigint2hex([arg], 40);
    if (ethers.isAddress(hex)) {
      return { address: arg };
    }
  }
  throw new ArgumentError(`invalid address: ${arg}`);
}
