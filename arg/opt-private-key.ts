import { ethers } from "ethers";
import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError } from "./types.ts";

export function opt_private_key(
  args?: Partial<Pick<BanqArgs, "private_key">>,
): string {
  const arg = args?.private_key ?? Deno.env.get("PRIVATE_KEY");
  if (typeof arg === "string") {
    const prefix = !arg.match(/^0x/i) ? "0x" : "";
    if (ethers.isHexString(prefix + arg, 32)) {
      return prefix + arg;
    }
  }
  throw new ArgumentError(`invalid private-key: ${arg}`);
}
