import { assertEquals, assertThrows } from "@std/assert";
import { opt_retry } from "./opt-retry.ts";
import { ArgumentError } from "./types.ts";

Deno.test("opt_retry [5]", () => {
  assertEquals(opt_retry({ retry: 5 }), { retry: 5, retry_gas_factor: 2 });
});
Deno.test("opt_retry [1]", () => {
  assertEquals(opt_retry({ retry: 1 }), { retry: 1, retry_gas_factor: 2 });
});
Deno.test("opt_retry [] default", () => {
  assertEquals(opt_retry(), { retry: 3, retry_gas_factor: 2 });
});
Deno.test("opt_retry [0] throws", () => {
  assertThrows(() => opt_retry({ retry: 0 }), ArgumentError);
});
Deno.test("opt_retry [-1] throws", () => {
  assertThrows(() => opt_retry({ retry: -1 }), ArgumentError);
});

Deno.test("opt_retry with retry_gas_factor=4", () => {
  assertEquals(opt_retry({ retry: 5, retry_gas_factor: 4 }), {
    retry: 5,
    retry_gas_factor: 4,
  });
});
Deno.test("opt_retry with retry_gas_factor=0 throws", () => {
  assertThrows(
    () => opt_retry({ retry: 5, retry_gas_factor: 0 }),
    ArgumentError,
  );
});
Deno.test("opt_retry with retry_gas_factor=-1 throws", () => {
  assertThrows(
    () => opt_retry({ retry: 5, retry_gas_factor: -1 }),
    ArgumentError,
  );
});
