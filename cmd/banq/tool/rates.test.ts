import { assertEquals } from "@std/assert";
import { format, rate_by, type RateInfo, retype } from "./rates.ts";

const UNIT = 10n ** 18n;

/**
 * @group retype
 */
Deno.test("rates retype: bigint -> Decimal conversion", () => {
  const info: RateInfo = {
    base: 0n,
    rate: UNIT,
    spread: UNIT / 2n,
    util: UNIT / 4n,
  };
  const result = retype(info);
  assertEquals(result.base.toNumber(), 0);
  assertEquals(result.rate.toNumber(), 1);
  assertEquals(result.spread.toNumber(), 0.5);
  assertEquals(result.util.toNumber(), 0.25);
});
/**
 * @group format
 */
Deno.test("rates format: exponential string formatting", () => {
  const info: RateInfo = {
    base: UNIT / 20n,
    rate: UNIT / 10n,
    spread: UNIT / 100n,
    util: UNIT / 2n,
  };
  const result = format(info, 2);
  assertEquals(typeof result.r, "string");
  assertEquals(typeof result.Δ, "string");
  assertEquals(typeof result.u, "string");
  assertEquals(typeof result.b, "string");
  // verify exponential notation
  assertEquals(result.r.includes("e"), true);
});
/**
 * @group rate_by
 */
Deno.test("rates rate_by: zero utilization returns zero even with base", () => {
  const util = 0n;
  const base = UNIT / 10n;
  const util_optimal = UNIT / 2n;
  const rate_optimal = UNIT / 10n;
  assertEquals(rate_by(util, base, util_optimal, rate_optimal), 0n);
});
Deno.test("rates rate_by: adds base in the kinked region", () => {
  const util = UNIT / 4n; // 25%
  const base = UNIT / 20n; // 5%
  const util_optimal = UNIT / 2n; // 50%
  const rate_optimal = UNIT / 10n; // 10%
  // rₖ(u) = u·R/U = 25%·10%/50% = 5%; rate = 5% + 5% = 10%
  assertEquals(rate_by(util, base, util_optimal, rate_optimal), UNIT / 10n);
});
Deno.test("rates rate_by: adds base above the optimal utilization", () => {
  const util = (UNIT * 3n) / 4n; // 75%
  const base = UNIT / 20n; // 5%
  const util_optimal = UNIT / 2n; // 50%
  const rate_optimal = UNIT / 10n; // 10%
  // rₖ(u) = [u·(1−R) − (U−R)]/(1−U) = [75%·90% − 40%]/50% = 55%; rate = 55% + 5% = 60%
  const expected = (UNIT * 3n) / 5n;
  assertEquals(rate_by(util, base, util_optimal, rate_optimal), expected);
});
Deno.test("rates rate_by: base lifts rate below cap", () => {
  const util = UNIT; // 100%
  const base = UNIT / 4n; // 25%
  const util_optimal = UNIT / 2n; // 50%
  const rate_optimal = UNIT / 10n; // 10%
  // rₖ(100%) = [100%·90% − 40%]/50% = 100%; rate = 100% + 25% = 125%
  assertEquals(
    rate_by(util, base, util_optimal, rate_optimal),
    (UNIT * 5n) / 4n,
  );
});
Deno.test("rates rate_by: caps at 200% when rₖ + base exceeds", () => {
  const util = UNIT; // 100%
  const base = (UNIT * 3n) / 2n; // 150%
  const util_optimal = UNIT / 2n; // 50%
  const rate_optimal = UNIT / 10n; // 10%
  // rₖ(100%) = 100%; rate = 100% + 150% = 250% -> capped at 200%
  assertEquals(rate_by(util, base, util_optimal, rate_optimal), 2n * UNIT);
});
Deno.test("rates rate_by: cap boundary returns rₖ + base", () => {
  const util = UNIT; // 100%
  const base = UNIT; // 100%
  const util_optimal = UNIT / 2n; // 50%
  const rate_optimal = UNIT / 10n; // 10%
  // rₖ(100%) = 100%; rₖ + base = 200% == cap, not exceeding -> returned uncapped
  assertEquals(rate_by(util, base, util_optimal, rate_optimal), 2n * UNIT);
});
