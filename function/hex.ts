/**
 * @returns a hex string with a "0x"-prefix (padded to given length);
 * if `ellipsis` is provided, it will shorten the hex accordingly.
 */
export function hex(
  n: bigint | string,
  length?: number,
  ellipsis?: number,
): string {
  const xxx = BigInt(n).toString(16).padStart(
    length ?? 0,
    "0",
  );
  if (ellipsis && ellipsis > 0) {
    const lhs = xxx.slice(0, ellipsis);
    const rhs = xxx.slice(-ellipsis);
    return `0x${lhs}…${rhs}`;
  }
  return `0x${xxx}`;
}
export default hex;
