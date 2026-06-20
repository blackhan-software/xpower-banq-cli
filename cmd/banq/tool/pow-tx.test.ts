import { assertEquals, assertRejects } from "@std/assert";
import { AbiCoder, id, makeError } from "ethers";
import { pow_send } from "./pow-tx.ts";

function callException(reason: string) {
  return makeError("revert", "CALL_EXCEPTION", {
    action: "call",
    data: "0x",
    reason,
    transaction: {
      to: "0x0000000000000000000000000000000000000000",
      data: "0x",
    },
    invocation: null,
    revert: null,
  });
}

/**
 * @group pow_send: calldata encoding
 */
Deno.test("pow_send: encodes selector + params correctly", async () => {
  let captured: { data: string; to: string } | undefined;
  const signer = {
    getAddress: () =>
      Promise.resolve(
        "0x0000000000000000000000000000000000000001",
      ),
    sendTransaction: (tx: { data: string; to: string }) => {
      captured = tx;
      return Promise.resolve();
    },
  };
  const pool = {
    target: "0x0000000000000000000000000000000000000002",
    blockHash: () =>
      Promise.resolve(
        "0x" + "00".repeat(32),
      ),
  };
  const token = "0x0000000000000000000000000000000000000003";
  const value = 100n;
  const result = await pow_send({
    pool: pool as never,
    signer: signer as never,
    selector: "supply(address,uint256)",
    token,
    value,
    difficulty: 0n, // zero difficulty = no PoW needed
    timeout: 1000,
    gas: {},
  });
  assertEquals(result, null);
  assertEquals(captured !== undefined, true);
  // verify selector prefix
  const sig = id("supply(address,uint256)").slice(0, 10);
  assertEquals(captured!.data.startsWith(sig), true);
  // verify destination
  assertEquals(captured!.to, pool.target);
  // verify params are encoded after selector
  const params = AbiCoder.defaultAbiCoder().encode(
    ["address", "uint256", "uint256"],
    [token, value, 0n],
  );
  assertEquals(captured!.data, sig + params.slice(2));
});
/**
 * @group pow_send: call-exception
 */
Deno.test("pow_send: CALL_EXCEPTION returns reason", async () => {
  const signer = {
    getAddress: () =>
      Promise.resolve(
        "0x0000000000000000000000000000000000000001",
      ),
    sendTransaction: () => Promise.reject(callException("pool paused")),
  };
  const pool = {
    target: "0x0000000000000000000000000000000000000002",
    blockHash: () =>
      Promise.resolve(
        "0x" + "00".repeat(32),
      ),
  };
  const result = await pow_send({
    pool: pool as never,
    signer: signer as never,
    selector: "supply(address,uint256)",
    token: "0x0000000000000000000000000000000000000003",
    value: 1n,
    difficulty: 0n,
    timeout: 1000,
    gas: {},
  });
  assertEquals(result, "pool paused");
});
/**
 * @group pow_send: non-call-exception
 */
Deno.test("pow_send: non-CALL_EXCEPTION rethrows", async () => {
  const signer = {
    getAddress: () =>
      Promise.resolve(
        "0x0000000000000000000000000000000000000001",
      ),
    sendTransaction: () => Promise.reject(new Error("timeout")),
  };
  const pool = {
    target: "0x0000000000000000000000000000000000000002",
    blockHash: () =>
      Promise.resolve(
        "0x" + "00".repeat(32),
      ),
  };
  await assertRejects(
    () =>
      pow_send({
        pool: pool as never,
        signer: signer as never,
        selector: "supply(address,uint256)",
        token: "0x0000000000000000000000000000000000000003",
        value: 1n,
        difficulty: 0n,
        timeout: 1000,
        gas: {},
      }),
    Error,
    "timeout",
  );
});
/**
 * @group pow_send: gas forwarding
 */
Deno.test("pow_send: forwards gas options to transaction", async () => {
  let captured: Record<string, unknown> | undefined;
  const signer = {
    getAddress: () =>
      Promise.resolve(
        "0x0000000000000000000000000000000000000001",
      ),
    sendTransaction: (tx: Record<string, unknown>) => {
      captured = tx;
      return Promise.resolve();
    },
  };
  const pool = {
    target: "0x0000000000000000000000000000000000000002",
    blockHash: () =>
      Promise.resolve(
        "0x" + "00".repeat(32),
      ),
  };
  await pow_send({
    pool: pool as never,
    signer: signer as never,
    selector: "borrow(address,uint256)",
    token: "0x0000000000000000000000000000000000000003",
    value: 50n,
    difficulty: 0n,
    timeout: 1000,
    gas: { gasLimit: 300000 },
  });
  assertEquals(captured!.gasLimit, 300000);
});
