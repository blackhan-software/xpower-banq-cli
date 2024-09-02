import { ethers } from "ethers";

/**
 * @returns a string representation of the address
 */
export function addressOf(
  n: bigint,
): string {
  if (typeof n === "string") {
    n = BigInt(n);
  }
  return ethers.getAddress(
    `${n.toString(16).padStart(40, "0")}`,
  );
}
/**
 * @returns an abbreviated string representation of the address
 */
export function abbressOf(
  n: bigint,
  ellipsis = 4,
): string {
  const address = `${n.toString(16).padStart(40, "0")}`;
  if (ellipsis > 0) {
    const suffix = address.slice(-ellipsis);
    const prefix = address.slice(2, 2 + ellipsis);
    return `0x${prefix}…${suffix}`;
  }
  return address;
}
