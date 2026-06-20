import { assertEquals } from "@std/assert";
import { AbiCoder, ethers, id } from "ethers";
import { supplyData } from "./supply-data.ts";

/**
 * @group supplyData: v10a
 */
Deno.test("supplyData: v10a encoding matches AbiCoder", () => {
  const account = "0x0000000000000000000000000000000000000001";
  const token = "0x0000000000000000000000000000000000000002";
  const amount = 1000000000000000000n;

  const result = supplyData(account, token, amount, "v10a");

  const selector = id("supply(address,address,uint256,bool)").slice(0, 10);
  const args = AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "uint256", "bool", "uint256"],
    [account, token, amount, true, 0n],
  );
  assertEquals(result, selector + args.slice(2));
});

/**
 * @group supplyData: v10b
 */
Deno.test("supplyData: v10b encoding matches AbiCoder", () => {
  const account = "0x0000000000000000000000000000000000000001";
  const token = "0x0000000000000000000000000000000000000002";
  const amount = 2000000000000000000n;

  const result = supplyData(account, token, amount, "v10b");

  const selector = id("supply(address,address,uint256,uint256)").slice(0, 10);
  const args = AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "uint256", "uint256", "uint256"],
    [account, token, amount, ethers.MaxUint256, 0n],
  );
  assertEquals(result, selector + args.slice(2));
});

/**
 * @group supplyData: different inputs
 */
Deno.test("supplyData: different accounts produce different encoding", () => {
  const token = "0x0000000000000000000000000000000000000002";
  const amount = 1000000000000000000n;

  const a = supplyData(
    "0x0000000000000000000000000000000000000001",
    token,
    amount,
    "v10a",
  );
  const b = supplyData(
    "0x0000000000000000000000000000000000000003",
    token,
    amount,
    "v10a",
  );

  assertEquals(a !== b, true);
});

Deno.test("supplyData: zero amount produces valid hex", () => {
  const result = supplyData(
    "0x0000000000000000000000000000000000000001",
    "0x0000000000000000000000000000000000000002",
    0n,
    "v10a",
  );
  assertEquals(typeof result, "string");
  assertEquals(result.length > 10, true);
});

Deno.test("supplyData: different run versions produce different encoding", () => {
  const account = "0x0000000000000000000000000000000000000001";
  const token = "0x0000000000000000000000000000000000000002";
  const amount = 1000000000000000000n;

  const a = supplyData(account, token, amount, "v10a");
  const b = supplyData(account, token, amount, "v10b");

  assertEquals(a !== b, true);
});
