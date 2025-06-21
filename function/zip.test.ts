import { assertEquals } from "@std/assert";
import { zip } from "./zip.ts";

/**
 * @group zip
 */
Deno.test("zip: default separators", () => {
  const result = zip([["a", 1], ["b", 2]]);
  assertEquals(result, "a=1 b=2");
});
Deno.test("zip: custom eq/sep", () => {
  const result = zip([["a", 1], ["b", 2]], ":", ",");
  assertEquals(result, "a:1,b:2");
});
Deno.test("zip: empty array", () => {
  assertEquals(zip([]), "");
});
