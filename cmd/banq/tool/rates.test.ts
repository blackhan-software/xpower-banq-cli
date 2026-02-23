import { assertEquals } from "@std/assert";
import { format, type RateInfo, retype } from "./rates.ts";

const UNIT = 10n ** 18n;

/**
 * @group retype
 */
Deno.test("rates retype: bigint -> Decimal conversion", () => {
  const info: RateInfo = { rate: UNIT, spread: UNIT / 2n, util: UNIT / 4n };
  const result = retype(info);
  assertEquals(result.rate.toNumber(), 1);
  assertEquals(result.spread.toNumber(), 0.5);
  assertEquals(result.util.toNumber(), 0.25);
});
/**
 * @group format
 */
Deno.test("rates format: exponential string formatting", () => {
  const info: RateInfo = {
    rate: UNIT / 10n,
    spread: UNIT / 100n,
    util: UNIT / 2n,
  };
  const result = format(info, 2);
  assertEquals(typeof result.r, "string");
  assertEquals(typeof result.Δ, "string");
  assertEquals(typeof result.u, "string");
  // verify exponential notation
  assertEquals(result.r.includes("e"), true);
});
