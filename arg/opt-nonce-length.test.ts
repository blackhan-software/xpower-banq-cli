import { assertEquals, assertThrows } from "@std/assert";
import { opt_nonce_length } from "./opt-nonce-length.ts";
import { ArgumentError } from "./types.ts";

Deno.test("opt_nonce_length [16]", () => {
  assertEquals(opt_nonce_length({ nonce_length: 16 }), { nonce_length: 16 });
});
Deno.test("opt_nonce_length [0]", () => {
  assertEquals(opt_nonce_length({ nonce_length: 0 }), { nonce_length: 0 });
});
Deno.test("opt_nonce_length [-1] throws", () => {
  assertThrows(
    () => opt_nonce_length({ nonce_length: -1 }),
    ArgumentError,
  );
});
Deno.test("opt_nonce_length [1.5] throws", () => {
  assertThrows(
    () => opt_nonce_length({ nonce_length: 1.5 }),
    ArgumentError,
  );
});
Deno.test("opt_nonce_length [] default", () => {
  assertEquals(opt_nonce_length(), { nonce_length: 8 });
});
