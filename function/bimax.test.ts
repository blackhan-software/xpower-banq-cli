import { assertEquals } from "@std/assert";
import { bimax } from "./bimax.ts";

Deno.test("bimax", () => {
  assertEquals(bimax(1n, 2n), 2n);
  assertEquals(bimax(2n, 1n), 2n);
});
