/**
 * Reward of a proof-of-work nonce in whole tokens, mirroring
 * `XPower._amountOf(level) = 2**level - 1` on-chain.
 */
export function amount_of(level: number): number {
  return 2 ** level - 1;
}
