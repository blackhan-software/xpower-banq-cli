import { assertEquals } from "@std/assert";
import type { AcmaEvent } from "./acma-types.ts";
import { reconstruct } from "./acma-state.ts";
import {
  acma_delays,
  acma_hierarchy,
  acma_logs,
  acma_members,
  acma_roles,
  acma_show,
  acma_targets,
} from "./acma-show.ts";

function sample_events(): AcmaEvent[] {
  return [
    {
      block: 100,
      logIndex: 0,
      txHash: "0x1",
      kind: "labeled",
      roleId: 10n,
      label: "POOL_CAP_SUPPLY_ROLE",
    },
    {
      block: 100,
      logIndex: 1,
      txHash: "0x1",
      kind: "labeled",
      roleId: 11n,
      label: "POOL_CAP_SUPPLY_ADMIN_ROLE",
    },
    {
      block: 100,
      logIndex: 2,
      txHash: "0x1",
      kind: "labeled",
      roleId: 12n,
      label: "FEED_RETWAP_ROLE",
    },
    {
      block: 101,
      logIndex: 0,
      txHash: "0x2",
      kind: "granted",
      roleId: 10n,
      account: 0x1000n,
      delay: 0,
      since: 0,
      newMember: true,
    },
    {
      block: 101,
      logIndex: 1,
      txHash: "0x2",
      kind: "granted",
      roleId: 10n,
      account: 0x2000n,
      delay: 86400,
      since: 0,
      newMember: true,
    },
    {
      block: 102,
      logIndex: 0,
      txHash: "0x3",
      kind: "granted",
      roleId: 12n,
      account: 0x3000n,
      delay: 0,
      since: 0,
      newMember: true,
    },
    {
      block: 103,
      logIndex: 0,
      txHash: "0x4",
      kind: "adm-set",
      roleId: 10n,
      admin: 11n,
    },
    {
      block: 104,
      logIndex: 0,
      txHash: "0x5",
      kind: "fn-role",
      target: 0x4000n,
      selector: "0xaabbccdd",
      roleId: 10n,
    },
    {
      block: 105,
      logIndex: 0,
      txHash: "0x6",
      kind: "grant·dt",
      roleId: 10n,
      delay: 86400,
      since: 1700000000,
    },
  ];
}

const OPTS = {
  permissions: { env: true },
};

/**
 * @group positive tests — acma_show
 */
Deno.test("acma-show: acma_show renders frame", OPTS, () => {
  const state = reconstruct(sample_events());
  const output = acma_show(state, 12345678, { addresses: false });
  assertEquals(output.includes("╔"), true);
  assertEquals(output.includes("╚"), true);
  assertEquals(output.includes("ACMA Authorizations"), true);
  assertEquals(output.includes("POOL_CAP_SUPPLY"), true);
  assertEquals(output.includes("FEED_RETWAP"), true);
});

/**
 * @group positive tests — acma_show with addresses
 */
Deno.test("acma-show: acma_show with addresses", OPTS, () => {
  const state = reconstruct(sample_events());
  const output = acma_show(state, 12345678, { addresses: true });
  assertEquals(output.includes("role"), true);
});

/**
 * @group positive tests — acma_roles
 */
Deno.test("acma-show: acma_roles renders frame", OPTS, () => {
  const state = reconstruct(sample_events());
  const output = acma_roles(state);
  assertEquals(output.includes("ACMA Roles"), true);
  assertEquals(output.includes("POOL_CAP_SUPPLY"), true);
  assertEquals(output.includes("roles"), true);
});

/**
 * @group positive tests — acma_members
 */
Deno.test("acma-show: acma_members renders frame", OPTS, () => {
  const state = reconstruct(sample_events());
  const output = acma_members(state, { addresses: false });
  assertEquals(output.includes("ACMA Members"), true);
  assertEquals(output.includes("addresses"), true);
});

/**
 * @group positive tests — acma_members with addresses
 */
Deno.test("acma-show: acma_members with addresses", OPTS, () => {
  const state = reconstruct(sample_events());
  const output = acma_members(state, { addresses: true });
  assertEquals(output.includes("ACMA Members"), true);
});

/**
 * @group positive tests — acma_targets
 */
Deno.test("acma-show: acma_targets renders frame", OPTS, () => {
  const state = reconstruct(sample_events());
  const output = acma_targets(state);
  assertEquals(output.includes("ACMA Targets"), true);
  assertEquals(output.includes("0xaabbccdd"), true);
  assertEquals(output.includes("POOL_CAP_SUPPLY"), true);
});

/**
 * @group positive tests — acma_hierarchy
 */
Deno.test("acma-show: acma_hierarchy renders frame", OPTS, () => {
  const state = reconstruct(sample_events());
  const output = acma_hierarchy(state);
  assertEquals(output.includes("ACMA Hierarchy"), true);
  assertEquals(output.includes("Exe Role"), true);
  assertEquals(output.includes("self-governed"), true);
  assertEquals(output.includes("ADMIN-governed"), true);
});

/**
 * @group positive tests — acma_delays
 */
Deno.test("acma-show: acma_delays renders frame", OPTS, () => {
  const state = reconstruct(sample_events());
  const output = acma_delays(state, { addresses: true });
  assertEquals(output.includes("ACMA Grant"), true);
  assertEquals(output.includes("ACMA Target"), true);
});

/**
 * @group positive tests — acma_logs
 */
Deno.test("acma-show: acma_logs renders frame", OPTS, () => {
  const state = reconstruct(sample_events());
  const output = acma_logs(state, {
    limit: 50,
    event_filter: [],
    role_filter: undefined,
    address_filter: undefined,
    asc: false,
    tx: false,
    timestamps: false,
  });
  assertEquals(output.includes("ACMA Logs"), true);
  assertEquals(output.includes("events"), true);
});

/**
 * @group positive tests — acma_logs with event filter
 */
Deno.test("acma-show: acma_logs filters by event kind", OPTS, () => {
  const state = reconstruct(sample_events());
  const output = acma_logs(state, {
    limit: 50,
    event_filter: ["granted"],
    role_filter: undefined,
    address_filter: undefined,
    asc: false,
    tx: false,
    timestamps: false,
  });
  assertEquals(output.includes("granted"), true);
  // should not contain labeled events
  assertEquals(output.includes("labeled"), false);
});

/**
 * @group positive tests — acma_logs ascending
 */
Deno.test("acma-show: acma_logs ascending order", OPTS, () => {
  const state = reconstruct(sample_events());
  const output = acma_logs(state, {
    limit: 50,
    event_filter: [],
    role_filter: undefined,
    address_filter: undefined,
    asc: true,
    tx: false,
    timestamps: false,
  });
  assertEquals(output.includes("ACMA Logs"), true);
});

/**
 * @group positive tests — acma_logs with tx
 */
Deno.test("acma-show: acma_logs with tx hash", OPTS, () => {
  const state = reconstruct(sample_events());
  const output = acma_logs(state, {
    limit: 50,
    event_filter: [],
    role_filter: undefined,
    address_filter: undefined,
    asc: false,
    tx: true,
    timestamps: false,
  });
  assertEquals(output.includes("0x"), true);
});

/**
 * @group positive tests — acma_logs with limit
 */
Deno.test("acma-show: acma_logs respects limit", OPTS, () => {
  const state = reconstruct(sample_events());
  const output = acma_logs(state, {
    limit: 2,
    event_filter: [],
    role_filter: undefined,
    address_filter: undefined,
    asc: false,
    tx: false,
    timestamps: false,
  });
  assertEquals(output.includes("2 of"), true);
});

/**
 * @group positive tests — acma_logs with spec event filter names
 */
Deno.test("acma-show: acma_logs accepts spec filter names", OPTS, () => {
  const state = reconstruct(sample_events());
  // use spec name "admin-changed" which maps to internal "adm-set"
  const output = acma_logs(state, {
    limit: 50,
    event_filter: ["admin-changed"],
    role_filter: undefined,
    address_filter: undefined,
    asc: false,
    tx: false,
    timestamps: false,
  });
  assertEquals(output.includes("adm-set"), true);
  assertEquals(output.includes("granted"), false);
});
/**
 * @group positive tests — acma_logs with mixed filter names
 */
Deno.test(
  "acma-show: acma_logs accepts both spec and abbrev names",
  OPTS,
  () => {
    const state = reconstruct(sample_events());
    // mix spec name "grant-delay" with abbreviated "labeled"
    const output = acma_logs(state, {
      limit: 50,
      event_filter: ["grant-delay", "labeled"],
      role_filter: undefined,
      address_filter: undefined,
      asc: false,
      tx: false,
      timestamps: false,
    });
    assertEquals(output.includes("grant·dt"), true);
    assertEquals(output.includes("labeled"), true);
    assertEquals(output.includes("granted"), false);
  },
);
/**
 * @group positive tests — empty state
 */
Deno.test("acma-show: empty state renders", OPTS, () => {
  const state = reconstruct([]);
  const output = acma_show(state, 0, { addresses: false });
  assertEquals(output.includes("╔"), true);
  assertEquals(output.includes("0 addresses"), true);
});
