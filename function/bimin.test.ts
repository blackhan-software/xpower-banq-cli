import { assertEquals } from "@std/assert";
import { bimin } from "./bimin.ts";

Deno.test("bimin", () => {
  assertEquals(bimin(1n, 2n), 1n);
  assertEquals(bimin(2n, 1n), 1n);
});
