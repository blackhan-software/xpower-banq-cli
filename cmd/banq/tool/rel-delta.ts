import { type ethers, isCallException } from "ethers";
import { addressOf as x } from "../../../function/address.ts";

/**
 * @returns average relative delta between bid/ask pairs
 */
export function relDelta(
  [lhs_bid, lhs_ask]: [bigint | null, bigint | null],
  [rhs_bid, rhs_ask]: [bigint | null, bigint | null],
  scale = 10n ** 18n, // fixed point scale
): number {
  if (lhs_bid === null || lhs_ask === null) {
    return Infinity;
  }
  if (rhs_bid === null || rhs_ask === null) {
    return Infinity;
  }
  // 2 * dif / sum in fixed point arithmetic
  const fpa = (lhs: bigint, rhs: bigint): number => {
    const dif = lhs > rhs ? lhs - rhs : rhs - lhs;
    const sum = lhs + rhs;
    if (sum === 0n) return 0;
    const fix = (2n * dif * scale) / sum;
    return Number(fix) / Number(scale);
  };
  return (fpa(rhs_bid, lhs_bid) + fpa(rhs_ask, lhs_ask)) / 2;
}
/**
 * @returns left-hand side quote from *oracle* (if any)
 */
export async function lhsQuote(
  ORACLE: ethers.Contract,
  { amount, source, target }: {
    amount: number;
    source: bigint;
    target: bigint;
  },
): Promise<[bigint | null, bigint | null]> {
  try {
    return await ORACLE.getQuotes(amount, x(source), x(target));
  } catch (e) {
    if (isCallException(e)) {
      return [null, null];
    }
    throw e;
  }
}
/**
 * @returns right-hand side quote from *feed* (if any)
 */
export async function rhsQuote(
  FEED: ethers.Contract,
  { amount }: { amount: number },
): Promise<[bigint | null, bigint | null]> {
  try {
    return await FEED.getQuotes(amount);
  } catch (_) {
    return [null, null];
  }
}
export default relDelta;
