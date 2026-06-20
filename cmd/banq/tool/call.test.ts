import { assertEquals, assertRejects } from "@std/assert";
import { makeError } from "ethers";
import { call } from "./call.ts";
import { BROADCAST } from "../../types.ts";

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
 * @group call: success
 */
Deno.test("call: success returns [args, [BROADCAST]]", async () => {
  const result = await call(
    () => Promise.resolve(),
    [1.0, "APOW"],
  );
  assertEquals(result, [[1.0, "APOW"], [BROADCAST]]);
});
/**
 * @group call: call-exception
 */
Deno.test("call: CALL_EXCEPTION returns [args, [reason]]", async () => {
  const result = await call(
    () => Promise.reject(callException("insufficient balance")),
    [1.0, "APOW"],
  );
  assertEquals(result, [[1.0, "APOW"], ["insufficient balance"]]);
});
Deno.test("call: CALL_EXCEPTION with null reason", async () => {
  const err = makeError("revert", "CALL_EXCEPTION", {
    action: "call",
    data: "0x",
    reason: null,
    transaction: {
      to: "0x0000000000000000000000000000000000000000",
      data: "0x",
    },
    invocation: null,
    revert: null,
  });
  const result = await call(
    () => Promise.reject(err),
    ["XPOW"],
  );
  assertEquals(result, [["XPOW"], [null]]);
});
/**
 * @group call: non-call-exception
 */
Deno.test("call: non-CALL_EXCEPTION rethrows", async () => {
  await assertRejects(
    () => call(() => Promise.reject(new Error("network")), ["APOW"]),
    Error,
    "network",
  );
});
