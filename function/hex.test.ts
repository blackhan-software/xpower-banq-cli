import { assertEquals } from "@std/assert";
import { hex } from "./hex.ts";

/**
 * @group hex
 */
Deno.test("hex: basic conversion", () => {
  assertEquals(hex(255n), "0xff");
});
Deno.test("hex: padding", () => {
  assertEquals(hex(1n, 4), "0x0001");
});
Deno.test("hex: ellipsis", () => {
  const result = hex(0xABCDEF1234567890n, undefined, 4);
  assertEquals(result, "0xabcd…7890");
});
Deno.test("hex: string input", () => {
  assertEquals(hex("255"), "0xff");
});
