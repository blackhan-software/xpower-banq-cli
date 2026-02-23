import { assertEquals } from "@std/assert";
import { relDelta } from "./rel-delta.ts";

/**
 * @group relDelta
 */
Deno.test("relDelta: equal pairs -> 0", () => {
  const result = relDelta([100n, 200n], [100n, 200n]);
  assertEquals(result, 0);
});
Deno.test("relDelta: null lhs values -> Infinity", () => {
  assertEquals(relDelta([null, null], [100n, 200n]), Infinity);
});
Deno.test("relDelta: null rhs values -> Infinity", () => {
  assertEquals(relDelta([100n, 200n], [null, null]), Infinity);
});
Deno.test("relDelta: known delta calculation", () => {
  // bid: lhs=100, rhs=200 => fpa = 2*100/300 = 2/3
  // ask: lhs=100, rhs=200 => fpa = 2*100/300 = 2/3
  // avg = 2/3
  const result = relDelta([100n, 100n], [200n, 200n]);
  const expected = 2 / 3;
  assertEquals(Math.abs(result - expected) < 1e-10, true);
});
Deno.test("relDelta: sum=0 -> 0", () => {
  const result = relDelta([0n, 0n], [0n, 0n]);
  assertEquals(result, 0);
});
