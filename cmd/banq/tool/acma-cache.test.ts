import { assertEquals } from "@std/assert";
import { events_from_cache } from "./acma-cache.ts";
import type { AcmaCacheData } from "./acma-types.ts";

/**
 * @group positive tests — events_from_cache roundtrip
 */
Deno.test("acma-cache: events_from_cache parses bigints", () => {
  const data: AcmaCacheData = {
    chainId: 43114,
    acma: "0x1234",
    fromBlock: 100,
    toBlock: 200,
    events: [{
      block: 150,
      logIndex: 0,
      txHash: "0xabc",
      kind: "granted",
      roleId: "123",
      account: "456",
      delay: 0,
      since: 0,
      newMember: true,
    }],
  };
  const events = events_from_cache(data);
  assertEquals(events.length, 1);
  assertEquals(events[0].roleId, 123n);
  assertEquals(events[0].account, 456n);
  assertEquals(events[0].block, 150);
  assertEquals(events[0].kind, "granted");
});

/**
 * @group positive tests — events_from_cache empty
 */
Deno.test("acma-cache: events_from_cache empty", () => {
  const data: AcmaCacheData = {
    chainId: 43114,
    acma: "0x1234",
    fromBlock: 0,
    toBlock: 0,
    events: [],
  };
  const events = events_from_cache(data);
  assertEquals(events.length, 0);
});

/**
 * @group positive tests — events_from_cache all event kinds
 */
Deno.test("acma-cache: events_from_cache labeled event", () => {
  const data: AcmaCacheData = {
    chainId: 1,
    acma: "0x0",
    fromBlock: 0,
    toBlock: 100,
    events: [{
      block: 50,
      logIndex: 0,
      txHash: "0xdef",
      kind: "labeled",
      roleId: "99",
      label: "MY_ROLE",
    }],
  };
  const events = events_from_cache(data);
  assertEquals(events[0].kind, "labeled");
  assertEquals(events[0].roleId, 99n);
  assertEquals(events[0].label, "MY_ROLE");
});

/**
 * @group positive tests — events_from_cache target events
 */
Deno.test("acma-cache: events_from_cache fn-role event", () => {
  const data: AcmaCacheData = {
    chainId: 1,
    acma: "0x0",
    fromBlock: 0,
    toBlock: 100,
    events: [{
      block: 50,
      logIndex: 0,
      txHash: "0x123",
      kind: "fn-role",
      target: "4660",
      selector: "0xaabbccdd",
      roleId: "5",
    }],
  };
  const events = events_from_cache(data);
  assertEquals(events[0].target, 4660n);
  assertEquals(events[0].selector, "0xaabbccdd");
  assertEquals(events[0].roleId, 5n);
});

/**
 * @group positive tests — events_from_cache operation events
 */
Deno.test("acma-cache: events_from_cache op·sched event", () => {
  const data: AcmaCacheData = {
    chainId: 1,
    acma: "0x0",
    fromBlock: 0,
    toBlock: 100,
    events: [{
      block: 50,
      logIndex: 0,
      txHash: "0x456",
      kind: "op·sched",
      operationId: "0xabcdef",
      nonce: 1,
      schedule: 1700000000,
      caller: "100",
      target: "200",
      data: "0x",
    }],
  };
  const events = events_from_cache(data);
  assertEquals(events[0].kind, "op·sched");
  assertEquals(events[0].caller, 100n);
  assertEquals(events[0].target, 200n);
  assertEquals(events[0].nonce, 1);
});
