import { assertEquals } from "@std/assert";
import type { RoleState } from "./acma-types.ts";
import {
  format_ranges,
  group_roles,
  member_signature,
  pool_display,
  split_pool_suffix,
  split_role_columns,
  strip_role_suffix,
} from "./acma-group.ts";

function role(
  id: bigint,
  label: string,
  members: [bigint, number, number][] = [],
): RoleState {
  return {
    id,
    label,
    tier: "exe",
    adminRole: 0n,
    guardRole: 0n,
    grantDelay: 0,
    grantDelaySince: 0,
    members: new Map(members.map(([addr, execDelay, since]) => [
      addr,
      { execDelay, since },
    ])),
  };
}

/**
 * @group positive tests — split_pool_suffix
 */
Deno.test("acma-group: split_pool_suffix parses pool suffix", () => {
  assertEquals(split_pool_suffix("POOL_TMP_SUPPLY_P000"), {
    base: "POOL_TMP_SUPPLY",
    prefix: "P",
    number: 0,
  });
});

Deno.test("acma-group: split_pool_suffix parses multi-digit number", () => {
  assertEquals(split_pool_suffix("FEED_RETWAP_P012"), {
    base: "FEED_RETWAP",
    prefix: "P",
    number: 12,
  });
});

Deno.test("acma-group: split_pool_suffix ignores non-pool digit suffixes", () => {
  assertEquals(split_pool_suffix("ROLE_007"), undefined);
  assertEquals(split_pool_suffix("POLS_FETCH0"), undefined);
  assertEquals(split_pool_suffix("POLS_HARVEST2"), undefined);
});

Deno.test("acma-group: split_pool_suffix returns undefined for plain names", () => {
  assertEquals(split_pool_suffix("ADMIN"), undefined);
  assertEquals(split_pool_suffix("POOL_CAP_SUPPLY"), undefined);
});

/**
 * @group positive tests — strip_role_suffix
 */
Deno.test("acma-group: strip_role_suffix removes _ROLE", () => {
  assertEquals(strip_role_suffix("FEED_RETWAP_ROLE"), "FEED_RETWAP");
});

Deno.test("acma-group: strip_role_suffix removes _ADMIN_ROLE", () => {
  assertEquals(
    strip_role_suffix("POOL_CAP_SUPPLY_ADMIN_ROLE"),
    "POOL_CAP_SUPPLY",
  );
});

Deno.test("acma-group: strip_role_suffix removes _GUARD_ROLE", () => {
  assertEquals(strip_role_suffix("FEED_RETWAP_GUARD_ROLE"), "FEED_RETWAP");
});

Deno.test("acma-group: strip_role_suffix leaves plain names", () => {
  assertEquals(strip_role_suffix("ADMIN"), "ADMIN");
});

/**
 * @group positive tests — split_role_columns
 */
Deno.test("acma-group: split_role_columns splits first token", () => {
  assertEquals(split_role_columns("FEED_RETWAP"), {
    first: "FEED",
    middle: "RETWAP",
  });
  assertEquals(split_role_columns("POOL_CAP_SUPPLY"), {
    first: "POOL",
    middle: "CAP_SUPPLY",
  });
});

Deno.test("acma-group: split_role_columns handles single token", () => {
  assertEquals(split_role_columns("ADMIN"), { first: "ADMIN", middle: "" });
});

/**
 * @group positive tests — format_ranges
 */
Deno.test("acma-group: format_ranges full run", () => {
  assertEquals(format_ranges([0, 1, 2, 3, 4, 5, 6]), "0:6");
});

Deno.test("acma-group: format_ranges non-sequential", () => {
  assertEquals(format_ranges([0, 2, 3, 4, 5]), "0,2:5");
});

Deno.test("acma-group: format_ranges two runs", () => {
  assertEquals(format_ranges([1, 2, 3, 5, 6]), "1:3,5:6");
});

Deno.test("acma-group: format_ranges single", () => {
  assertEquals(format_ranges([4]), "4");
});

Deno.test("acma-group: format_ranges unsorted input", () => {
  assertEquals(format_ranges([6, 0, 2, 1]), "0:2,6");
});

Deno.test("acma-group: format_ranges empty", () => {
  assertEquals(format_ranges([]), "");
});

/**
 * @group positive tests — pool_display
 */
Deno.test("acma-group: pool_display maps empty pool to any", () => {
  assertEquals(pool_display(""), "any");
});

Deno.test("acma-group: pool_display keeps pool ranges", () => {
  assertEquals(pool_display("0:6"), "0:6");
  assertEquals(pool_display("0"), "0");
  assertEquals(pool_display("0,2:5"), "0,2:5");
});

/**
 * @group positive tests — member_signature
 */
Deno.test("acma-group: member_signature equal for same grants", () => {
  const a = role(1n, "R_P000", [[0x1000n, 0, 0], [0x2000n, 86400, 0]]);
  const b = role(2n, "R_P001", [[0x2000n, 86400, 0], [0x1000n, 0, 0]]);
  assertEquals(member_signature(a), member_signature(b));
});

Deno.test("acma-group: member_signature differs for different grants", () => {
  const a = role(1n, "R_P000", [[0x1000n, 0, 0]]);
  const b = role(2n, "R_P001", [[0x1000n, 3600, 0]]);
  assertEquals(member_signature(a) === member_signature(b), false);
});

Deno.test("acma-group: member_signature ignores grant since", () => {
  const a = role(1n, "R_P000", [[0x1000n, 0, 1786536770]]);
  const b = role(2n, "R_P001", [[0x1000n, 0, 1786537101]]);
  assertEquals(member_signature(a), member_signature(b));
});

Deno.test("acma-group: member_signature differs on grantDelay", () => {
  const a = { ...role(1n, "R_P000", [[0x1000n, 0, 0]]), grantDelay: 0 };
  const b = { ...role(2n, "R_P001", [[0x1000n, 0, 0]]), grantDelay: 86400 };
  assertEquals(member_signature(a) === member_signature(b), false);
});

/**
 * @group positive tests — group_roles
 */
Deno.test("acma-group: groups uniform family into range", () => {
  const roles = Array.from(
    { length: 7 },
    (_, i) =>
      role(BigInt(i + 10), `POOL_TMP_SUPPLY_P${String(i).padStart(3, "0")}`, [
        [0x1000n, 0, 0],
      ]),
  );
  const rows = group_roles(roles);
  assertEquals(rows.length, 1);
  assertEquals(rows[0].name, "POOL_TMP_SUPPLY_P{0:6}");
  assertEquals(rows[0].first, "POOL");
  assertEquals(rows[0].middle, "TMP_SUPPLY");
  assertEquals(rows[0].pool, "0:6");
});

Deno.test("acma-group: non-sequential group renders comma ranges", () => {
  const roles = [0, 2, 3, 4, 5].map((i) =>
    role(BigInt(i + 10), `FEED_RETWAP_P${String(i).padStart(3, "0")}`, [
      [0x1000n, 0, 0],
    ])
  );
  const rows = group_roles(roles);
  assertEquals(rows.length, 1);
  assertEquals(rows[0].name, "FEED_RETWAP_P{0,2:5}");
  assertEquals(rows[0].first, "FEED");
  assertEquals(rows[0].middle, "RETWAP");
  assertEquals(rows[0].pool, "0,2:5");
});

Deno.test("acma-group: distinct member sets stay separate", () => {
  const roles = [
    role(1n, "POOL_TMP_SUPPLY_P000", [[0x1000n, 0, 0]]),
    role(2n, "POOL_TMP_SUPPLY_P001", [[0x2000n, 0, 0]]),
  ];
  const rows = group_roles(roles);
  assertEquals(rows.length, 2);
  assertEquals(rows[0].name, "POOL_TMP_SUPPLY_P000");
  assertEquals(rows[1].name, "POOL_TMP_SUPPLY_P001");
  assertEquals(rows[0].first, "POOL");
  assertEquals(rows[0].middle, "TMP_SUPPLY");
  assertEquals(rows[0].pool, "0");
  assertEquals(rows[1].pool, "1");
});

Deno.test("acma-group: single-pool family keeps original name", () => {
  const rows = group_roles([
    role(1n, "POOL_TMP_SUPPLY_P000", [[0x1000n, 0, 0]]),
  ]);
  assertEquals(rows.length, 1);
  assertEquals(rows[0].name, "POOL_TMP_SUPPLY_P000");
  assertEquals(rows[0].first, "POOL");
  assertEquals(rows[0].middle, "TMP_SUPPLY");
  assertEquals(rows[0].pool, "0");
});

Deno.test("acma-group: non-matching names pass through", () => {
  const rows = group_roles([
    role(0n, "ADMIN"),
    role(1n, "POOL_CAP_SUPPLY", [[0x1000n, 0, 0]]),
  ]);
  assertEquals(rows.length, 2);
  assertEquals(rows[0].name, "ADMIN");
  assertEquals(rows[0].first, "ADMIN");
  assertEquals(rows[0].middle, "");
  assertEquals(rows[0].pool, "");
  assertEquals(rows[1].name, "POOL_CAP_SUPPLY");
  assertEquals(rows[1].first, "POOL");
  assertEquals(rows[1].middle, "CAP_SUPPLY");
  assertEquals(rows[1].pool, "");
});

Deno.test("acma-group: token-index roles stay pool-free", () => {
  const rows = group_roles([
    role(1n, "POLS_FETCH0_ROLE", [[0x1000n, 0, 0]]),
    role(2n, "POLS_FETCH1_ROLE", [[0x1000n, 0, 0]]),
  ]);
  assertEquals(rows.length, 2);
  assertEquals(rows[0].name, "POLS_FETCH0");
  assertEquals(rows[0].first, "POLS");
  assertEquals(rows[0].middle, "FETCH0");
  assertEquals(rows[0].pool, "");
  assertEquals(rows[1].name, "POLS_FETCH1");
  assertEquals(rows[1].first, "POLS");
  assertEquals(rows[1].middle, "FETCH1");
  assertEquals(rows[1].pool, "");
});

Deno.test("acma-group: grouped row uses representative role cells", () => {
  const roles = [
    role(1n, "POOL_TMP_SUPPLY_P000", [[0x1000n, 0, 0]]),
    role(2n, "POOL_TMP_SUPPLY_P001", [[0x1000n, 0, 0]]),
  ];
  const rows = group_roles(roles);
  assertEquals(rows[0].role.members.get(0x1000n)?.execDelay, 0);
});

Deno.test("acma-group: sys role sorts after exe roles", () => {
  const admin = {
    ...role(0n, "ADMIN"),
    tier: "sys" as const,
  };
  const rows = group_roles([
    admin,
    role(1n, "FEED_RETWAP_ROLE_P000", [[0x1000n, 0, 0]]),
    role(2n, "FEED_RETWAP_ROLE_P001", [[0x1000n, 0, 0]]),
  ]);
  assertEquals(rows.length, 2);
  assertEquals(rows[0].name, "FEED_RETWAP_P{0:1}");
  assertEquals(rows[0].tier, "exe");
  assertEquals(rows[0].first, "FEED");
  assertEquals(rows[0].middle, "RETWAP");
  assertEquals(rows[0].pool, "0:1");
  assertEquals(rows[1].name, "ADMIN");
  assertEquals(rows[1].tier, "sys");
  assertEquals(rows[1].first, "ADMIN");
  assertEquals(rows[1].middle, "");
  assertEquals(rows[1].pool, "");
});

Deno.test("acma-group: uniform family with distinct grant since groups", () => {
  const roles = [0, 1, 2, 3, 4, 5, 6].map((i) =>
    role(BigInt(i + 10), `FEED_RETWAP_ROLE_P${String(i).padStart(3, "0")}`, [
      [0x1000n, 0, 1786536770 + i * 59],
    ])
  );
  const rows = group_roles(roles);
  assertEquals(rows.length, 1);
  assertEquals(rows[0].name, "FEED_RETWAP_P{0:6}");
  assertEquals(rows[0].first, "FEED");
  assertEquals(rows[0].middle, "RETWAP");
  assertEquals(rows[0].pool, "0:6");
});
