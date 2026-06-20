import { assertEquals } from "@std/assert";
import type { AcmaEvent } from "./acma-types.ts";
import { ADMIN_ROLE, PUBLIC_ROLE } from "./acma-types.ts";
import {
  all_addresses,
  count_by_tier,
  member_of,
  reconstruct,
  role_name,
  roles_of,
  sorted_roles,
} from "./acma-state.ts";

/**
 * @group positive tests — reconstruct empty
 */
Deno.test("acma-state: reconstruct empty events", () => {
  const state = reconstruct([]);
  // builtins always present
  assertEquals(state.roles.has(ADMIN_ROLE), true);
  assertEquals(state.roles.has(PUBLIC_ROLE), true);
  assertEquals(state.targets.size, 0);
  assertEquals(state.events.length, 0);
});

/**
 * @group positive tests — reconstruct granted
 */
Deno.test("acma-state: reconstruct RoleGranted", () => {
  const events: AcmaEvent[] = [{
    block: 100,
    logIndex: 0,
    txHash: "0xabc",
    kind: "labeled",
    roleId: 1n,
    label: "FEED_RETWAP_ROLE",
  }, {
    block: 101,
    logIndex: 0,
    txHash: "0xdef",
    kind: "granted",
    roleId: 1n,
    account: 0xABCDn,
    delay: 0,
    since: 0,
    newMember: true,
  }];
  const state = reconstruct(events);
  const role = state.roles.get(1n)!;
  assertEquals(role.label, "FEED_RETWAP_ROLE");
  assertEquals(role.tier, "exe");
  assertEquals(role.members.size, 1);
  assertEquals(role.members.has(0xABCDn), true);
  const m = role.members.get(0xABCDn)!;
  assertEquals(m.execDelay, 0);
  assertEquals(m.since, 0);
});

/**
 * @group positive tests — reconstruct revoked
 */
Deno.test("acma-state: reconstruct RoleRevoked", () => {
  const events: AcmaEvent[] = [{
    block: 100,
    logIndex: 0,
    txHash: "0xabc",
    kind: "granted",
    roleId: 1n,
    account: 0xABCDn,
    delay: 0,
    since: 0,
    newMember: true,
  }, {
    block: 101,
    logIndex: 0,
    txHash: "0xdef",
    kind: "revoked",
    roleId: 1n,
    account: 0xABCDn,
  }];
  const state = reconstruct(events);
  const role = state.roles.get(1n)!;
  assertEquals(role.members.size, 0);
});

/**
 * @group positive tests — reconstruct labeled
 */
Deno.test("acma-state: reconstruct RoleLabel tiers", () => {
  const events: AcmaEvent[] = [{
    block: 100,
    logIndex: 0,
    txHash: "0x1",
    kind: "labeled",
    roleId: 10n,
    label: "SUPPLY_SET_TARGET_ROLE",
  }, {
    block: 100,
    logIndex: 1,
    txHash: "0x1",
    kind: "labeled",
    roleId: 11n,
    label: "SUPPLY_SET_TARGET_ADMIN_ROLE",
  }, {
    block: 100,
    logIndex: 2,
    txHash: "0x1",
    kind: "labeled",
    roleId: 12n,
    label: "SUPPLY_SET_TARGET_GUARD_ROLE",
  }];
  const state = reconstruct(events);
  assertEquals(state.roles.get(10n)!.tier, "exe");
  assertEquals(state.roles.get(11n)!.tier, "adm");
  assertEquals(state.roles.get(12n)!.tier, "grd");
});

/**
 * @group positive tests — admin/guard changed
 */
Deno.test("acma-state: reconstruct admin/guard changed", () => {
  const events: AcmaEvent[] = [{
    block: 100,
    logIndex: 0,
    txHash: "0x1",
    kind: "adm-set",
    roleId: 1n,
    admin: 2n,
  }, {
    block: 101,
    logIndex: 0,
    txHash: "0x2",
    kind: "grd-set",
    roleId: 1n,
    guardian: 3n,
  }];
  const state = reconstruct(events);
  const role = state.roles.get(1n)!;
  assertEquals(role.adminRole, 2n);
  assertEquals(role.guardRole, 3n);
});

/**
 * @group positive tests — grant delay
 */
Deno.test("acma-state: reconstruct grant delay", () => {
  const events: AcmaEvent[] = [{
    block: 100,
    logIndex: 0,
    txHash: "0x1",
    kind: "grant·dt",
    roleId: 1n,
    delay: 86400,
    since: 1700000000,
  }];
  const state = reconstruct(events);
  const role = state.roles.get(1n)!;
  assertEquals(role.grantDelay, 86400);
  assertEquals(role.grantDelaySince, 1700000000);
});

/**
 * @group positive tests — function role
 */
Deno.test("acma-state: reconstruct function role", () => {
  const events: AcmaEvent[] = [{
    block: 100,
    logIndex: 0,
    txHash: "0x1",
    kind: "fn-role",
    target: 0x1234n,
    selector: "0xaabbccdd",
    roleId: 5n,
  }];
  const state = reconstruct(events);
  const target = state.targets.get(0x1234n)!;
  assertEquals(target.functions.get("0xaabbccdd"), 5n);
});

/**
 * @group positive tests — target delay
 */
Deno.test("acma-state: reconstruct target delay", () => {
  const events: AcmaEvent[] = [{
    block: 100,
    logIndex: 0,
    txHash: "0x1",
    kind: "tgt·dt",
    target: 0x1234n,
    delay: 3600,
    since: 1700000000,
  }];
  const state = reconstruct(events);
  const target = state.targets.get(0x1234n)!;
  assertEquals(target.adminDelay, 3600);
});

/**
 * @group positive tests — target closed
 */
Deno.test("acma-state: reconstruct target closed", () => {
  const events: AcmaEvent[] = [{
    block: 100,
    logIndex: 0,
    txHash: "0x1",
    kind: "closed",
    target: 0x1234n,
    closed: true,
  }];
  const state = reconstruct(events);
  assertEquals(state.targets.get(0x1234n)!.closed, true);
});

/**
 * @group positive tests — role_name stripping
 */
Deno.test("acma-state: role_name strips suffixes", () => {
  const state = reconstruct([{
    block: 1,
    logIndex: 0,
    txHash: "0x1",
    kind: "labeled",
    roleId: 10n,
    label: "POOL_CAP_SUPPLY_ROLE",
  }, {
    block: 1,
    logIndex: 1,
    txHash: "0x1",
    kind: "labeled",
    roleId: 11n,
    label: "POOL_CAP_SUPPLY_ADMIN_ROLE",
  }, {
    block: 1,
    logIndex: 2,
    txHash: "0x1",
    kind: "labeled",
    roleId: 12n,
    label: "POOL_CAP_SUPPLY_GUARD_ROLE",
  }]);
  assertEquals(role_name(state.roles.get(10n)!), "POOL_CAP_SUPPLY");
  assertEquals(role_name(state.roles.get(11n)!), "POOL_CAP_SUPPLY");
  assertEquals(role_name(state.roles.get(12n)!), "POOL_CAP_SUPPLY");
});

/**
 * @group positive tests — builtin role names
 */
Deno.test("acma-state: builtin role names", () => {
  const state = reconstruct([]);
  assertEquals(role_name(state.roles.get(ADMIN_ROLE)!), "ADMIN");
  assertEquals(role_name(state.roles.get(PUBLIC_ROLE)!), "PUBLIC");
});

/**
 * @group positive tests — all_addresses
 */
Deno.test("acma-state: all_addresses", () => {
  const events: AcmaEvent[] = [{
    block: 100,
    logIndex: 0,
    txHash: "0x1",
    kind: "granted",
    roleId: 1n,
    account: 0x10n,
    delay: 0,
    since: 0,
    newMember: true,
  }, {
    block: 101,
    logIndex: 0,
    txHash: "0x2",
    kind: "granted",
    roleId: 2n,
    account: 0x20n,
    delay: 0,
    since: 0,
    newMember: true,
  }, {
    block: 102,
    logIndex: 0,
    txHash: "0x3",
    kind: "granted",
    roleId: 1n,
    account: 0x20n,
    delay: 0,
    since: 0,
    newMember: true,
  }];
  const state = reconstruct(events);
  const addrs = all_addresses(state);
  assertEquals(addrs.length, 2);
  assertEquals(addrs[0], 0x10n);
  assertEquals(addrs[1], 0x20n);
});

/**
 * @group positive tests — count_by_tier
 */
Deno.test("acma-state: count_by_tier", () => {
  const events: AcmaEvent[] = [{
    block: 1,
    logIndex: 0,
    txHash: "0x1",
    kind: "labeled",
    roleId: 10n,
    label: "A_ROLE",
  }, {
    block: 1,
    logIndex: 1,
    txHash: "0x1",
    kind: "labeled",
    roleId: 11n,
    label: "A_ADMIN_ROLE",
  }, {
    block: 2,
    logIndex: 0,
    txHash: "0x2",
    kind: "granted",
    roleId: 10n,
    account: 0x1n,
    delay: 0,
    since: 0,
    newMember: true,
  }, {
    block: 3,
    logIndex: 0,
    txHash: "0x3",
    kind: "granted",
    roleId: 11n,
    account: 0x1n,
    delay: 0,
    since: 0,
    newMember: true,
  }, {
    block: 4,
    logIndex: 0,
    txHash: "0x4",
    kind: "granted",
    roleId: ADMIN_ROLE,
    account: 0x1n,
    delay: 0,
    since: 0,
    newMember: true,
  }];
  const state = reconstruct(events);
  const counts = count_by_tier(state);
  assertEquals(counts.exe, 1);
  assertEquals(counts.adm, 1);
  assertEquals(counts.grd, 0);
  assertEquals(counts.sys, 1);
});

/**
 * @group positive tests — roles_of
 */
Deno.test("acma-state: roles_of address", () => {
  const events: AcmaEvent[] = [{
    block: 1,
    logIndex: 0,
    txHash: "0x1",
    kind: "granted",
    roleId: 1n,
    account: 0xAAn,
    delay: 0,
    since: 0,
    newMember: true,
  }, {
    block: 2,
    logIndex: 0,
    txHash: "0x2",
    kind: "granted",
    roleId: 2n,
    account: 0xAAn,
    delay: 0,
    since: 0,
    newMember: true,
  }, {
    block: 3,
    logIndex: 0,
    txHash: "0x3",
    kind: "granted",
    roleId: 3n,
    account: 0xBBn,
    delay: 0,
    since: 0,
    newMember: true,
  }];
  const state = reconstruct(events);
  assertEquals(roles_of(state, 0xAAn), 2);
  assertEquals(roles_of(state, 0xBBn), 1);
  assertEquals(roles_of(state, 0xCCn), 0);
});

/**
 * @group positive tests — member_of
 */
Deno.test("acma-state: member_of", () => {
  const events: AcmaEvent[] = [{
    block: 1,
    logIndex: 0,
    txHash: "0x1",
    kind: "granted",
    roleId: 1n,
    account: 0xAAn,
    delay: 86400,
    since: 1700000000,
    newMember: true,
  }];
  const state = reconstruct(events);
  const role = state.roles.get(1n)!;
  const m = member_of(role, 0xAAn);
  assertEquals(m?.execDelay, 86400);
  assertEquals(m?.since, 1700000000);
  assertEquals(member_of(role, 0xBBn), undefined);
});

/**
 * @group positive tests — sorted_roles order
 */
Deno.test("acma-state: sorted_roles groups by tier", () => {
  const events: AcmaEvent[] = [{
    block: 1,
    logIndex: 0,
    txHash: "0x1",
    kind: "labeled",
    roleId: 10n,
    label: "B_ROLE",
  }, {
    block: 1,
    logIndex: 1,
    txHash: "0x1",
    kind: "labeled",
    roleId: 11n,
    label: "A_ADMIN_ROLE",
  }, {
    block: 1,
    logIndex: 2,
    txHash: "0x1",
    kind: "labeled",
    roleId: 12n,
    label: "A_ROLE",
  }];
  const state = reconstruct(events);
  const sorted = sorted_roles(state);
  // exe roles first (A, B), then adm (A), then sys (ADMIN, PUBLIC)
  const tiers = sorted.map((r) => r.tier);
  // exe should come before adm, adm before sys
  const exe_idx = tiers.indexOf("exe");
  const adm_idx = tiers.indexOf("adm");
  const sys_idx = tiers.indexOf("sys");
  assertEquals(exe_idx < adm_idx, true);
  assertEquals(adm_idx < sys_idx, true);
});
