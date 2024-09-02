import { assertEquals, assertThrows } from "@std/assert";
import { opt_oracle } from "./opt-oracle.ts";
import { ArgumentError } from "./types.ts";
import { type Registry, resolve_arg_oracle } from "../env/registry.ts";

const OPTS = { permissions: { env: true } };

function fake_reg(): Registry {
  return {
    tokens: new Map(),
    byAddress: new Map(),
    oracles: new Map(),
    acma: 0n,
    pools: new Map(),
    caps: 0n,
  };
}

Deno.test("opt_oracle [T000]", OPTS, () => {
  const { address, name } = opt_oracle({ oracle: "T000" });
  assertEquals(name, "T000");
  assertEquals(address, 0n);
});
Deno.test("opt_oracle [] default T000", OPTS, () => {
  const { name } = opt_oracle();
  assertEquals(name, "T000");
});
Deno.test("opt_oracle [bigint]", OPTS, () => {
  const address = 0x123n;
  const result = opt_oracle({ oracle: address });
  assertEquals(result.address, address);
  assertEquals(result.name, "");
});
Deno.test("opt_oracle [unknown] lenient offline", OPTS, () => {
  const { name, address } = opt_oracle({ oracle: "T999" });
  assertEquals(name, "T999");
  assertEquals(address, 0n);
});
Deno.test("resolve_arg_oracle maps name to address", OPTS, () => {
  const reg = fake_reg();
  reg.oracles.set("T000", 0x456n);
  assertEquals(resolve_arg_oracle(opt_oracle({ oracle: "T000" }), reg), {
    address: 0x456n,
    name: "T000",
  });
});
Deno.test("resolve_arg_oracle [unknown] throws", OPTS, () => {
  assertThrows(
    () => resolve_arg_oracle(opt_oracle({ oracle: "T999" }), fake_reg()),
    ArgumentError,
    "invalid oracle: T999",
  );
});
