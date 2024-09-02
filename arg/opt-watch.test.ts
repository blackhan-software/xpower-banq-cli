import { assertEquals } from "@std/assert";
import { opt_watch } from "./opt-watch.ts";

Deno.test("opt_watch ['']", () => {
  assertEquals(opt_watch({ watch: "" }), [true]);
});
Deno.test("opt_watch ['10']", () => {
  assertEquals(opt_watch({ watch: "10" }), [true, [10]]);
});
Deno.test("opt_watch ['5@2']", () => {
  assertEquals(opt_watch({ watch: "5@2" }), [true, [5, 2]]);
});
Deno.test("opt_watch ['100@all']", () => {
  assertEquals(opt_watch({ watch: "100@all" }), [true, [100, Infinity]]);
});
Deno.test("opt_watch ['100@ALL']", () => {
  assertEquals(opt_watch({ watch: "100@ALL" }), [true, [100, Infinity]]);
});
Deno.test("opt_watch [invalid]", () => {
  assertEquals(opt_watch({ watch: "abc" }), [false]);
});
Deno.test("opt_watch [] default", () => {
  assertEquals(opt_watch(), [false]);
});
