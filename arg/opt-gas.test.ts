import { assertEquals } from "@std/assert";
import type { BanqArgs } from "../cli/banq/banq.ts";
import {
  opt_gas,
  opt_gas_limit,
  opt_max_fee_per_gas,
  opt_max_priority_fee_per_gas,
} from "./opt-gas.ts";

Deno.test("opt_gas_limit [100000]", () => {
  assertEquals(opt_gas_limit({ gas_limit: 100000 }), { gasLimit: 100000 });
});
Deno.test("opt_gas_limit ['100000']", () => {
  assertEquals(opt_gas_limit({ gas_limit: "100000" }), { gasLimit: 100000 });
});
Deno.test("opt_gas_limit [] default", () => {
  assertEquals(opt_gas_limit(), { gasLimit: undefined });
});
Deno.test("opt_max_fee_per_gas [30]", () => {
  assertEquals(opt_max_fee_per_gas({ max_fee_per_gas: 30 }), {
    maxFeePerGas: 30,
  });
});
Deno.test("opt_max_priority_fee_per_gas [2]", () => {
  assertEquals(
    opt_max_priority_fee_per_gas({ max_priority_fee_per_gas: 2 }),
    { maxPriorityFeePerGas: 2 },
  );
});
Deno.test("opt_gas combined", () => {
  const gas = opt_gas({
    gas_limit: 100000,
    max_fee_per_gas: 30,
    max_priority_fee_per_gas: 2,
  } as unknown as BanqArgs);
  assertEquals(gas.gasLimit, 100000);
  assertEquals(gas.maxFeePerGas, 30);
  assertEquals(gas.maxPriorityFeePerGas, 2);
});
Deno.test("opt_gas defaults", () => {
  const gas = opt_gas({} as unknown as BanqArgs);
  assertEquals(gas.gasLimit, undefined);
  assertEquals(gas.maxFeePerGas, undefined);
  assertEquals(gas.maxPriorityFeePerGas, undefined);
});

Deno.test("opt_gas with factor=1 is identity for integers", () => {
  const gas = opt_gas({
    gas_limit: 100000,
    max_fee_per_gas: 30,
    max_priority_fee_per_gas: 2,
  } as unknown as BanqArgs, 1);
  assertEquals(gas.gasLimit, 100000);
  assertEquals(gas.maxFeePerGas, 30);
  assertEquals(gas.maxPriorityFeePerGas, 2);
});
Deno.test("opt_gas with factor=2 scales gas values", () => {
  const gas = opt_gas({
    gas_limit: 100000,
    max_fee_per_gas: 30,
    max_priority_fee_per_gas: 2,
  } as unknown as BanqArgs, 2);
  assertEquals(gas.gasLimit, 100000);
  assertEquals(gas.maxFeePerGas, 60);
  assertEquals(gas.maxPriorityFeePerGas, 4);
});
Deno.test("opt_gas with factor=0.5 rounds up", () => {
  const gas = opt_gas({
    max_fee_per_gas: 31,
    max_priority_fee_per_gas: 5,
  } as unknown as BanqArgs, 0.5);
  assertEquals(gas.maxFeePerGas, 16);
  assertEquals(gas.maxPriorityFeePerGas, 3);
});
Deno.test("opt_gas with factor skips undefined values", () => {
  const gas = opt_gas({} as unknown as BanqArgs, 3);
  assertEquals(gas.maxFeePerGas, undefined);
  assertEquals(gas.maxPriorityFeePerGas, undefined);
  assertEquals(gas.gasLimit, undefined);
});
