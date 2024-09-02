import { assertEquals, assertThrows } from "@std/assert";
import { opt_timeout } from "./opt-timeout.ts";
import { ArgumentError } from "./types.ts";

Deno.test("opt_timeout [1000]", () => {
  assertEquals(opt_timeout({ timeout: 1000 }), 1000);
});
Deno.test("opt_timeout [0]", () => {
  assertEquals(opt_timeout({ timeout: 0 }), 0);
});
Deno.test("opt_timeout [-1] throws", () => {
  assertThrows(() => opt_timeout({ timeout: -1 }), ArgumentError);
});
Deno.test("opt_timeout [] default", () => {
  assertEquals(opt_timeout(), 300_000);
});
