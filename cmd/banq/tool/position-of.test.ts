import { assertEquals } from "@std/assert";
import { my } from "./position-of.ts";

/**
 * @group my
 */
Deno.test("my: supply -> sXXX", () => {
  assertEquals(my("APOW", "supply"), "sAPOW");
});
Deno.test("my: borrow -> bXXX", () => {
  assertEquals(my("XPOW", "borrow"), "bXPOW");
});
