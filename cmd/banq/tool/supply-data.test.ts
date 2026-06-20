import { assertEquals } from "@std/assert";
import { AbiCoder, ethers, id } from "ethers";
import { supplyData } from "./supply-data.ts";

/**
 * @group supplyData: encoding
 */
Deno.test("supplyData: encoding matches AbiCoder", () => {
  const account = "0x0000000000000000000000000000000000000001";
  const token = "0x0000000000000000000000000000000000000002";
  const amount = 2000000000000000000n;

  const result = supplyData(account, token, amount);

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
  );
  const b = supplyData(
    "0x0000000000000000000000000000000000000003",
    token,
    amount,
  );

  assertEquals(a !== b, true);
});

Deno.test("supplyData: zero amount produces valid hex", () => {
  const result = supplyData(
    "0x0000000000000000000000000000000000000001",
    "0x0000000000000000000000000000000000000002",
    0n,
  );
  assertEquals(typeof result, "string");
  assertEquals(result.length > 10, true);
});
