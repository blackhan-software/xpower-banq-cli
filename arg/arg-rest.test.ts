import { assertEquals } from "@std/assert";
import { arg_rest } from "./arg-rest.ts";

Deno.test("arg_rest []", () => {
  assertEquals([...arg_rest([])], []);
});
Deno.test("arg_rest [1, 'a', true]", () => {
  assertEquals([...arg_rest([1, "a", true])], [1, "a", true]);
});
Deno.test("arg_rest drains array", () => {
  const rest = [1, 2, 3];
  [...arg_rest(rest)];
  assertEquals(rest, []);
});
