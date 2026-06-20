import { assertEquals, assertRejects } from "@std/assert";
import { makeError } from "ethers";
import { withRetry } from "./with-retry.ts";

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

Deno.test("withRetry: success on first attempt", async () => {
  let calls = 0;
  const result = await withRetry(
    (n) => {
      calls++;
      return Promise.resolve(n);
    },
    { maxRetry: 3, delayMs: 0 },
  );
  assertEquals(result, 0);
  assertEquals(calls, 1);
});

Deno.test("withRetry: retries on network error then succeeds", async () => {
  let calls = 0;
  const result = await withRetry(
    (n) => {
      calls++;
      if (calls < 3) return Promise.reject(new Error("network"));
      return Promise.resolve(n);
    },
    { maxRetry: 5, delayMs: 0 },
  );
  assertEquals(result, 2);
  assertEquals(calls, 3);
});

Deno.test("withRetry: CALL_EXCEPTION throws immediately", async () => {
  let calls = 0;
  await assertRejects(
    () =>
      withRetry(
        () => {
          calls++;
          return Promise.reject(callException("already initialized"));
        },
        { maxRetry: 3, delayMs: 0 },
      ),
  );
  assertEquals(calls, 1);
});

Deno.test("withRetry: rethrows after max retries exhausted", async () => {
  let calls = 0;
  await assertRejects(
    () =>
      withRetry(
        () => {
          calls++;
          return Promise.reject(new Error("network"));
        },
        { maxRetry: 2, delayMs: 0 },
      ),
    Error,
    "network",
  );
  assertEquals(calls, 3);
});

Deno.test("withRetry: maxRetry=0 rethrows immediately", async () => {
  let calls = 0;
  await assertRejects(
    () =>
      withRetry(
        () => {
          calls++;
          return Promise.reject(new Error("fail fast"));
        },
        { maxRetry: 0, delayMs: 0 },
      ),
    Error,
    "fail fast",
  );
  assertEquals(calls, 1);
});
