import { assertEquals, assertThrows } from "@std/assert";
import { opt_batch_size } from "./opt-batch-size.ts";
import { ArgumentError } from "./types.ts";

Deno.test("opt_batch_size [1]", () => {
  assertEquals(opt_batch_size({ batch_size: 1 }), { batch_size: 1 });
});
Deno.test("opt_batch_size [8]", () => {
  assertEquals(opt_batch_size({ batch_size: 8 }), { batch_size: 8 });
});
Deno.test("opt_batch_size ['4']", () => {
  assertEquals(opt_batch_size({ batch_size: "4" }), { batch_size: 4 });
});
Deno.test("opt_batch_size [0] throws", () => {
  assertThrows(() => opt_batch_size({ batch_size: 0 }), ArgumentError);
});
Deno.test("opt_batch_size [-1] throws", () => {
  assertThrows(() => opt_batch_size({ batch_size: -1 }), ArgumentError);
});
Deno.test("opt_batch_size [1.5] throws", () => {
  assertThrows(() => opt_batch_size({ batch_size: 1.5 }), ArgumentError);
});
Deno.test("opt_batch_size ['abc'] throws", () => {
  assertThrows(() => opt_batch_size({ batch_size: "abc" }), ArgumentError);
});
Deno.test("opt_batch_size [] default", () => {
  assertEquals(opt_batch_size(), { batch_size: 1 });
});
