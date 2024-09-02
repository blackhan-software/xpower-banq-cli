import { assertEquals, assertThrows } from "@std/assert";
import { opt_at } from "./opt-at.ts";
import { ArgumentError } from "./types.ts";

Deno.test("opt_at [now]", () => {
  assertEquals(opt_at({ at: "now" }), null);
});
Deno.test("opt_at [latest]", () => {
  assertEquals(opt_at({ at: "latest" }), null);
});
Deno.test("opt_at [LATEST]", () => {
  assertEquals(opt_at({ at: "LATEST" }), null);
});
Deno.test("opt_at [all]", () => {
  assertEquals(opt_at({ at: "all" }), Infinity);
});
Deno.test("opt_at [ALL]", () => {
  assertEquals(opt_at({ at: "ALL" }), Infinity);
});
Deno.test("opt_at [42]", () => {
  assertEquals(opt_at({ at: 42 }), 42);
});
Deno.test("opt_at [invalid] throws", () => {
  assertThrows(() => opt_at({ at: "invalid" }), ArgumentError);
});
Deno.test("opt_at [3.14] throws", () => {
  assertThrows(() => opt_at({ at: 3.14 }), ArgumentError);
});
Deno.test("opt_at [] default", () => {
  assertEquals(opt_at(), Infinity);
});
Deno.test("opt_at [null] default", () => {
  assertEquals(opt_at({}), Infinity);
});
