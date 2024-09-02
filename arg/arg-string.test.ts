import { assertEquals, assertThrows } from "@std/assert";
import { arg_string, arg_strings } from "./arg-string.ts";
import { ArgumentError } from "./types.ts";

Deno.test("arg_string ['hello']", () => {
  assertEquals(arg_string(["hello"]), "hello");
});
Deno.test("arg_string [42] throws", () => {
  assertThrows(() => arg_string([42]), ArgumentError);
});
Deno.test("arg_string [] throws", () => {
  assertThrows(() => arg_string([]), ArgumentError);
});
Deno.test("arg_string [] fallback", () => {
  assertEquals(arg_string([], "default"), "default");
});
Deno.test("arg_strings ['a', 'b']", () => {
  const rest: string[] = ["a", "b"];
  assertEquals([...arg_strings(rest)], ["a", "b"]);
});
Deno.test("arg_strings ['a', 'b'] length=1", () => {
  const rest: string[] = ["a", "b"];
  assertEquals([...arg_strings(rest, 1)], ["a"]);
  assertEquals(rest, ["b"]);
});
