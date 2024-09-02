import { assertEquals, assertThrows } from "@std/assert";
import { arg_number, arg_numbers } from "./arg-number.ts";
import { ArgumentError } from "./types.ts";

Deno.test("arg_number [42]", () => {
  assertEquals(arg_number([42]), 42);
});
Deno.test("arg_number [3.14]", () => {
  assertEquals(arg_number([3.14]), 3.14);
});
Deno.test("arg_number ['abc'] throws", () => {
  assertThrows(() => arg_number(["abc"]), ArgumentError);
});
Deno.test("arg_number [] throws", () => {
  assertThrows(() => arg_number([]), ArgumentError);
});
Deno.test("arg_number [] fallback", () => {
  assertEquals(arg_number([], 99), 99);
});
Deno.test("arg_numbers [1, 2, 3]", () => {
  const rest: number[] = [1, 2, 3];
  assertEquals([...arg_numbers(rest)], [1, 2, 3]);
});
Deno.test("arg_numbers [1, 2] length=1", () => {
  const rest: number[] = [1, 2];
  assertEquals([...arg_numbers(rest, 1)], [1]);
  assertEquals(rest, [2]);
});
