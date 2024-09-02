import { assertEquals, assertThrows } from "@std/assert";
import { arg_address } from "./arg-address.ts";
import { ArgumentError } from "./types.ts";

// valid checksummed address as bigint
const ADDR = 0xD5eA3da3693a6C196641c1562F28146304dD28eEn;

Deno.test("arg_address [valid bigint]", () => {
  assertEquals(arg_address([ADDR]), ADDR);
});
Deno.test("arg_address [0n] throws", () => {
  // 0n pads to 0x000...000 which is a valid address
  assertEquals(arg_address([0n]), 0n);
});
Deno.test("arg_address ['string'] throws", () => {
  assertThrows(() => arg_address(["0xabc"]), ArgumentError);
});
Deno.test("arg_address [] throws", () => {
  assertThrows(() => arg_address([]), ArgumentError);
});
Deno.test("arg_address [] fallback", () => {
  assertEquals(arg_address([], ADDR), ADDR);
});
