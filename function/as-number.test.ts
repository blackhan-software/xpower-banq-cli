import { assertEquals } from "@std/assert";
import { as_number } from "./as-number.ts";

/**
 * @group as_number
 */
Deno.test("as_number: valid number", () => {
  assertEquals(as_number("42"), 42);
});
Deno.test("as_number: NaN -> undefined", () => {
  assertEquals(as_number("not-a-number"), undefined);
});
Deno.test("as_number: empty string -> 0", () => {
  assertEquals(as_number(""), 0);
});
Deno.test("as_number: Infinity", () => {
  assertEquals(as_number("Infinity"), Infinity);
});
