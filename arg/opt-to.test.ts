import { assertEquals, assertThrows } from "@std/assert";
import { opt_to } from "./opt-to.ts";
import { ArgumentError } from "./types.ts";

Deno.test("opt_to [valid hex string]", () => {
  const addr = "0xD5eA3da3693a6C196641c1562F28146304dD28eE";
  const { address } = opt_to({ to: addr });
  assertEquals(address, BigInt(addr));
});
Deno.test("opt_to [valid bigint]", () => {
  const n = 0xD5eA3da3693a6C196641c1562F28146304dD28eEn;
  const { address } = opt_to({ to: n });
  assertEquals(address, n);
});
Deno.test("opt_to [] default 0n", () => {
  assertEquals(opt_to(), { address: 0n });
});
Deno.test("opt_to [invalid] throws", () => {
  assertThrows(() => opt_to({ to: "not-an-address" }), ArgumentError);
});
