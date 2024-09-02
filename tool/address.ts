/**
 * @returns a string representation of the address
 */
export function addressOf(
  n: bigint,
): string {
  return `0x${n.toString(16)}`;
}
/**
 * @returns an abbreviated string representation of the address
 */
export function abbressOf(
  n: bigint,
  ellipsis = 4,
): string {
  if (ellipsis > 0) {
    const hex = n.toString(16);
    const suffix = hex.slice(-ellipsis);
    const prefix = hex.slice(0, ellipsis);
    return `0x${prefix}…${suffix}`;
  }
  return `0x${n.toString(16)}`;
}
