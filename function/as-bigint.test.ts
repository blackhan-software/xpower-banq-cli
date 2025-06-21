import { assertEquals } from "@std/assert";
import { as_bigint } from "./as-bigint.ts";

/**
 * @group as_bigint
 */
Deno.test("as_bigint: valid hex", () => {
  assertEquals(as_bigint("0xff"), 255n);
});
Deno.test("as_bigint: valid decimal", () => {
  assertEquals(as_bigint("42"), 42n);
});
Deno.test("as_bigint: invalid string -> undefined", () => {
  assertEquals(as_bigint("not-a-number"), undefined);
});
