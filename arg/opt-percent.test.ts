import { assertEquals, assertThrows } from "@std/assert";
import {
  opt_percent,
  opt_percent_max,
  opt_percent_min,
} from "./opt-percent.ts";
import { ArgumentError } from "./types.ts";

Deno.test("opt_percent [50]", () => {
  assertEquals(opt_percent({ percent: 50 }), 0.5);
});
Deno.test("opt_percent [0]", () => {
  assertEquals(opt_percent({ percent: 0 }), 0);
});
Deno.test("opt_percent [-1] throws", () => {
  assertThrows(() => opt_percent({ percent: -1 }), ArgumentError);
});
Deno.test("opt_percent [] default", () => {
  assertEquals(opt_percent(), 0);
});
Deno.test("opt_percent_min [] default", () => {
  assertEquals(opt_percent_min(), 0.03);
});
Deno.test("opt_percent_max [] default", () => {
  assertEquals(opt_percent_max(), 1.0);
});
