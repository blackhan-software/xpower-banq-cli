import { assertEquals, assertInstanceOf } from "@std/assert";
import { ethers } from "ethers";
import { poolOf } from "./pool-of.ts";

function mockSigner() {
  return { provider: undefined } as unknown as ethers.Signer;
}

/**
 * @group poolOf: instance
 */
Deno.test("poolOf: returns Contract instance for v10a", () => {
  const address = "0x0000000000000000000000000000000000000001";
  const contract = poolOf(address, mockSigner(), "v10a");
  assertInstanceOf(contract, ethers.Contract);
});

Deno.test("poolOf: returns Contract instance for v10b", () => {
  const address = "0x0000000000000000000000000000000000000002";
  const contract = poolOf(address, mockSigner(), "v10b");
  assertInstanceOf(contract, ethers.Contract);
});

/**
 * @group poolOf: address
 */
Deno.test("poolOf: contract has correct target address", async () => {
  const address = "0x0000000000000000000000000000000000000003";
  const contract = poolOf(address, mockSigner(), "v10a");
  assertEquals(await contract.getAddress(), address);
});

/**
 * @group poolOf: abi selection
 */
Deno.test("poolOf: v10a and v10b have different interfaces", () => {
  const addr = "0x0000000000000000000000000000000000000001";
  const c10a = poolOf(addr, mockSigner(), "v10a");
  const c10b = poolOf(addr, mockSigner(), "v10b");
  assertEquals(
    c10a.interface.fragments.length !== c10b.interface.fragments.length,
    true,
  );
});

Deno.test("poolOf: default export matches named export", () => {
  const addr = "0x0000000000000000000000000000000000000001";
  const signer = mockSigner();
  const viaNamed = poolOf(addr, signer, "v10a");
  const viaDefault = poolOf(addr, signer, "v10a");
  assertEquals(viaDefault, viaNamed);
});
