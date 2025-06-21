import { assertEquals } from "@std/assert";
import { Decimal } from "decimal.js";
import { as_decimal } from "./as-decimal.ts";

/**
 * @group as_decimal
 */
Deno.test("as_decimal: zero", () => {
  assertEquals(as_decimal(0n).eq(new Decimal(0)), true);
});
Deno.test("as_decimal: 1e18 -> 1.0", () => {
  const result = as_decimal(10n ** 18n);
  assertEquals(result.eq(new Decimal(1)), true);
});
Deno.test("as_decimal: 5e17 -> 0.5", () => {
  const result = as_decimal(5n * 10n ** 17n);
  assertEquals(result.eq(new Decimal("0.5")), true);
});
Deno.test("as_decimal: large value", () => {
  const result = as_decimal(123_456n * 10n ** 18n);
  assertEquals(result.eq(new Decimal(123_456)), true);
});
Deno.test("as_decimal: sub-unit precision", () => {
  const result = as_decimal(1n);
  assertEquals(result.eq(new Decimal("1e-18")), true);
});
