import { ethers } from "ethers";
import { bigint2hex } from "./parser.ts";
import { type Argument, ArgumentError } from "./types.ts";

export function arg_address(
  rest: Argument[],
): bigint {
  const arg = rest.shift();
  if (typeof arg === "undefined") {
    throw new ArgumentError("insufficient arguments");
  }
  if (typeof arg !== "bigint" || arg < 0x0n) {
    throw new ArgumentError(`invalid address: ${arg}`);
  }
  const [hex] = bigint2hex([arg], 40);
  if (!ethers.isAddress(hex)) {
    throw new ArgumentError(`invalid address: ${arg}`);
  }
  return arg;
}
