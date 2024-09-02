import { assertEquals, assertThrows } from "@std/assert";
import { opt_digits } from "./opt-digits.ts";
import { ArgumentError } from "./types.ts";

Deno.test("opt_digits [4]", () => {
  assertEquals(opt_digits({ digits: 4 }), 4);
});
Deno.test("opt_digits [0]", () => {
  assertEquals(opt_digits({ digits: 0 }), 0);
});
Deno.test("opt_digits [-1] throws", () => {
  assertThrows(() => opt_digits({ digits: -1 }), ArgumentError);
});
Deno.test("opt_digits [1.5] throws", () => {
  assertThrows(() => opt_digits({ digits: 1.5 }), ArgumentError);
});
Deno.test("opt_digits [] default", () => {
  assertEquals(opt_digits(), 2);
});
