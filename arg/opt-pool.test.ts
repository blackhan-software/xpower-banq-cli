import { assertEquals, assertThrows } from "@std/assert";
import { opt_pool } from "./opt-pool.ts";
import { ArgumentError } from "./types.ts";

const OPTS = { permissions: { env: true } };

Deno.test("opt_pool [P000]", OPTS, () => {
  const { address, name } = opt_pool({ pool: "P000" });
  assertEquals(name, "P000");
  assertEquals(typeof address, "bigint");
});
Deno.test("opt_pool [] default P000", OPTS, () => {
  const { name } = opt_pool();
  assertEquals(name, "P000");
});
Deno.test("opt_pool [bigint]", OPTS, () => {
  const { address } = opt_pool({ pool: "P000" });
  const result = opt_pool({ pool: address });
  assertEquals(result.address, address);
});
Deno.test("opt_pool [unknown] throws", OPTS, () => {
  assertThrows(() => opt_pool({ pool: "P999" }), ArgumentError);
});
