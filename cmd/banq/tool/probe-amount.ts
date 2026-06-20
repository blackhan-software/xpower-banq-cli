import { parseUnits } from "ethers";

/**
 * @returns probe amount in source token base units; defaults to one whole
 * token (matching the unit used by on-chain `retwap`)
 */
export function probeAmount(
  decimals: number | bigint,
  amount?: number,
): bigint {
  const dec = Number(decimals);
  if (amount === undefined) {
    return 10n ** BigInt(dec);
  }
  return parseUnits(`${amount}`, dec);
}
