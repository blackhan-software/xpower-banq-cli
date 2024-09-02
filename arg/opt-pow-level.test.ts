import { assertEquals, assertThrows } from "@std/assert";
import { opt_pow_level } from "./opt-pow-level.ts";
import { ArgumentError } from "./types.ts";

Deno.test("opt_pow_level [0]", () => {
  assertEquals(opt_pow_level({ pow_level: 0 }), { pow_level: 0 });
});
Deno.test("opt_pow_level [64]", () => {
  assertEquals(opt_pow_level({ pow_level: 64 }), { pow_level: 64 });
});
Deno.test("opt_pow_level [65] throws", () => {
  assertThrows(() => opt_pow_level({ pow_level: 65 }), ArgumentError);
});
Deno.test("opt_pow_level [-1] throws", () => {
  assertThrows(() => opt_pow_level({ pow_level: -1 }), ArgumentError);
});
Deno.test("opt_pow_level [1.5] throws", () => {
  assertThrows(() => opt_pow_level({ pow_level: 1.5 }), ArgumentError);
});
Deno.test("opt_pow_level [] default", () => {
  assertEquals(opt_pow_level(), { pow_level: 8 });
});
