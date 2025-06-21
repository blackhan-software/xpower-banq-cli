import { assertEquals } from "@std/assert";
import { amount_of } from "./amount.ts";

Deno.test("amount_of mirrors XPower._amountOf = 2**level - 1", () => {
  assertEquals(amount_of(1), 1);
  assertEquals(amount_of(6), 63);
  assertEquals(amount_of(8), 255);
});
