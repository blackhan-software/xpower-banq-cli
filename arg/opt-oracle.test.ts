import { assertEquals, assertThrows } from "@std/assert";
import { opt_oracle } from "./opt-oracle.ts";
import { ArgumentError } from "./types.ts";

const OPTS = { permissions: { env: true } };

Deno.test("opt_oracle [T000]", OPTS, () => {
  const { address, name } = opt_oracle({ oracle: "T000" });
  assertEquals(name, "T000");
  assertEquals(typeof address, "bigint");
});
Deno.test("opt_oracle [] default T000", OPTS, () => {
  const { name } = opt_oracle();
  assertEquals(name, "T000");
});
Deno.test("opt_oracle [bigint]", OPTS, () => {
  const { address } = opt_oracle({ oracle: "T000" });
  const result = opt_oracle({ oracle: address });
  assertEquals(result.address, address);
});
Deno.test("opt_oracle [unknown] throws", OPTS, () => {
  assertThrows(() => opt_oracle({ oracle: "T999" }), ArgumentError);
});
