import { assertEquals } from "@std/assert";
import { abbressOf, addressOf } from "./address.ts";

/**
 * @group addressOf
 */
Deno.test("addressOf: zero", () => {
  const result = addressOf(0n);
  assertEquals(result, "0x0000000000000000000000000000000000000000");
});
Deno.test("addressOf: small bigint", () => {
  const result = addressOf(1n);
  assertEquals(result, "0x0000000000000000000000000000000000000001");
});
Deno.test("addressOf: max uint160", () => {
  const max = (1n << 160n) - 1n;
  const result = addressOf(max);
  assertEquals(result.length, 42);
  assertEquals(result.startsWith("0x"), true);
});
/**
 * @group abbressOf
 */
Deno.test("abbressOf: default ellipsis", () => {
  const result = abbressOf(0xABCD1234n);
  assertEquals(result.includes("…"), true);
  assertEquals(result.startsWith("0x"), true);
});
Deno.test("abbressOf: ellipsis=0 returns full address", () => {
  const result = abbressOf(1n, 0);
  assertEquals(result, addressOf(1n));
});
Deno.test("abbressOf: custom length", () => {
  const result = abbressOf(0xABCD1234n, 6);
  const parts = result.split("…");
  assertEquals(parts[0].length, 2 + 6); // "0x" + 6 chars
  assertEquals(parts[1].length, 6);
});
