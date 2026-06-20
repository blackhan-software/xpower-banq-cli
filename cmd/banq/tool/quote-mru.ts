import type { RunVersion } from "../../../arg/types.ts";

/**
 * Decoded `Tick` payload of a v11b `Refresh` event. Despite the `_log`
 * suffix, the fields hold the *linear*-space cache values written by
 * `retwap` (`_tick_lin`); `stamp` is the refresh (block) timestamp.
 */
export type TickArgs = {
  price: bigint;
  spread: bigint;
  stamp: bigint;
};

export function quote_mru(
  quote: bigint | TickArgs,
  run: RunVersion,
): Record<string, bigint> {
  if (run === "v11b") {
    const tick = quote as TickArgs;
    return {
      quote_mid: BigInt(tick.price),
      quote_rel: BigInt(tick.spread),
      quote_utc: BigInt(tick.stamp),
    };
  }
  const packed = quote as bigint;
  return {
    quote_mid: packed >> 128n,
    quote_rel: (packed >> 64n) & ((1n << 64n) - 1n),
    quote_utc: (packed >> 16n) & ((1n << 48n) - 1n),
  };
}
