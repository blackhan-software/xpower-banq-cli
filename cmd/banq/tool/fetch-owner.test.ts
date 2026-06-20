import { assertEquals, assertRejects } from "@std/assert";
import { makeError } from "ethers";
import { fetch_owner } from "./fetch-owner.ts";

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
 * @group fetch_owner: success
 */
Deno.test("fetch_owner: returns owner address on success", async () => {
  const apow: never = { owner: () => Promise.resolve("0xabcdef") } as never;
  const result = await fetch_owner(apow, "APOW");
  assertEquals(result, { owner: "0xabcdef" });
});

/**
 * @group fetch_owner: call-exception
 */
Deno.test("fetch_owner: CALL_EXCEPTION returns CommandResult", async () => {
  const apow: never = {
    owner: () => Promise.reject(callException("insufficient balance")),
  } as never;
  const result = await fetch_owner(apow, "APOW");
  assertEquals(result, [["APOW"], ["insufficient balance"]]);
});

Deno.test("fetch_owner: CALL_EXCEPTION with null reason", async () => {
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
  const apow: never = { owner: () => Promise.reject(err) } as never;
  const result = await fetch_owner(apow, "APOW");
  assertEquals(result, [["APOW"], [null]]);
});

/**
 * @group fetch_owner: rethrow
 */
Deno.test("fetch_owner: non-CALL_EXCEPTION rethrows", async () => {
  const apow: never = {
    owner: () => Promise.reject(new Error("network error")),
  } as never;
  await assertRejects(
    () => fetch_owner(apow, "APOW"),
    Error,
    "network error",
  );
});

Deno.test("fetch_owner: null owner rethrows AssertionError", async () => {
  const apow: never = { owner: () => Promise.resolve(null) } as never;
  await assertRejects(
    () => fetch_owner(apow, "APOW"),
    Error,
    "invalid owner: null",
  );
});

Deno.test("fetch_owner: empty string owner rethrows", async () => {
  const apow: never = { owner: () => Promise.resolve("") } as never;
  await assertRejects(
    () => fetch_owner(apow, "APOW"),
    Error,
    "invalid owner:",
  );
});
