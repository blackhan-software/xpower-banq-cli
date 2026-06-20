import { assertEquals, assertInstanceOf } from "@std/assert";
import { ethers } from "ethers";
import { poolOf } from "./pool-of.ts";

function mockSigner() {
  return { provider: undefined } as unknown as ethers.Signer;
}

/**
 * @group poolOf: instance
 */
Deno.test("poolOf: returns Contract instance for v11b", () => {
  const address = "0x0000000000000000000000000000000000000002";
  const contract = poolOf(address, mockSigner(), "v11b");
  assertInstanceOf(contract, ethers.Contract);
});

/**
 * @group poolOf: address
 */
Deno.test("poolOf: contract has correct target address", async () => {
  const address = "0x0000000000000000000000000000000000000003";
  const contract = poolOf(address, mockSigner(), "v11b");
  assertEquals(await contract.getAddress(), address);
});

/**
 * @group poolOf: abi selection
 */
Deno.test("poolOf: v11b and v11a have different interfaces", () => {
  const addr = "0x0000000000000000000000000000000000000001";
  const c11b = poolOf(addr, mockSigner(), "v11b");
  const c11a = poolOf(addr, mockSigner(), "v11a");
  assertEquals(
    c11b.interface.format() !== c11a.interface.format(),
    true,
  );
});

Deno.test("poolOf: default export matches named export", () => {
  const addr = "0x0000000000000000000000000000000000000001";
  const signer = mockSigner();
  const viaNamed = poolOf(addr, signer, "v11b");
  const viaDefault = poolOf(addr, signer, "v11b");
  assertEquals(viaDefault, viaNamed);
});
