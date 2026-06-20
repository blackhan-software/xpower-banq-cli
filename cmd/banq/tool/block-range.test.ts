import { assertEquals } from "@std/assert";
import { blockRange } from "./block-range.ts";

/**
 * @group blockRange
 */
Deno.test("blockRange: single-element range [DLT]", () => {
  const [lhs, rhs] = blockRange(1000, [100]);
  assertEquals(lhs, 900);
  assertEquals(rhs, 1000);
});
Deno.test("blockRange: two-element range [DLT, IDX]", () => {
  const [lhs, rhs] = blockRange(1000, [100, 2]);
  assertEquals(lhs, 1000 - 100 * 3);
  assertEquals(rhs, 1000 - 100 * 2);
});
Deno.test("blockRange: boundary values", () => {
  const [lhs, rhs] = blockRange(0, [0]);
  assertEquals(lhs, 0);
  assertEquals(rhs, 0);
});
