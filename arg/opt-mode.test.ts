import { assertEquals, assertThrows } from "@std/assert";
import { opt_mode } from "./opt-mode.ts";
import { ArgumentError } from "./types.ts";

Deno.test("opt_mode [supply]", () => {
  assertEquals(opt_mode({ mode: "supply" }), { mode: "supply" });
});
Deno.test("opt_mode [borrow]", () => {
  assertEquals(opt_mode({ mode: "borrow" }), { mode: "borrow" });
});
Deno.test("opt_mode [invalid] throws", () => {
  assertThrows(
    () => opt_mode({ mode: "invalid" as "supply" }),
    ArgumentError,
  );
});
Deno.test("opt_mode [] throws", () => {
  assertThrows(() => opt_mode(), ArgumentError);
});
