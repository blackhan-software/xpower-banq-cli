import { assertEquals } from "@std/assert";
import { probeAmount } from "./probe-amount.ts";

/**
 * @group probeAmount
 */
Deno.test("probeAmount: default USDC -> 1 token", () => {
  assertEquals(probeAmount(6), 1_000_000n);
});
Deno.test("probeAmount: default APOW -> 1 token", () => {
  assertEquals(probeAmount(18n), 1_000_000_000_000_000_000n);
});
Deno.test("probeAmount: explicit human amount", () => {
  assertEquals(probeAmount(6, 1.5), 1_500_000n);
});
Deno.test("probeAmount: explicit zero", () => {
  assertEquals(probeAmount(18, 0), 0n);
});
