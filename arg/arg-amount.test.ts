import { assertEquals, assertThrows } from "@std/assert";
import { arg_amount } from "./arg-amount.ts";
import { ArgumentError } from "./types.ts";

Deno.test("arg_amount [1.0]", () => {
  assertEquals(arg_amount([1.0]), 1.0);
});
Deno.test("arg_amount [0]", () => {
  assertEquals(arg_amount([0]), 0);
});
Deno.test("arg_amount [-1.0] throws", () => {
  assertThrows(() => arg_amount([-1.0]), ArgumentError);
});
Deno.test("arg_amount ['abc'] throws", () => {
  assertThrows(() => arg_amount(["abc"]), ArgumentError);
});
Deno.test("arg_amount [] throws", () => {
  assertThrows(() => arg_amount([]), ArgumentError);
});
Deno.test("arg_amount [] fallback", () => {
  assertEquals(arg_amount([], 5.0), 5.0);
});
Deno.test("arg_amount shifts rest", () => {
  const rest: (number | string)[] = [2.0, "extra"];
  assertEquals(arg_amount(rest), 2.0);
  assertEquals(rest, ["extra"]);
});
