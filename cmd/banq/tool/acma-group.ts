import type { RoleState, RoleTier } from "./acma-types.ts";
import { role_name } from "./acma-state.ts";

/**
 * Parsed trailing `_P<digits>` pool suffix of a role name.
 * `POOL_TMP_SUPPLY_P000` → { base: "POOL_TMP_SUPPLY", prefix: "P", number: 0 }
 */
export type PoolSuffix = {
  base: string;
  prefix: "P";
  number: number;
};

/**
 * Split a role name's trailing `_P<digits>` pool suffix into its base and a
 * padding-free pool number. Returns `undefined` when the name has no pool
 * suffix (e.g. `ADMIN`, `POOL_CAP_SUPPLY`, `POLS_FETCH0`).
 */
export function split_pool_suffix(name: string): PoolSuffix | undefined {
  const m = /^(.*)_P(\d+)$/.exec(name);
  if (!m) return undefined;
  return { base: m[1], prefix: "P", number: Number(m[2]) };
}

/**
 * Format a sorted list of numbers as a comma-separated run list:
 * contiguous entries become `start:end` ranges, padding-free.
 * `[0,1,2,3,4,5,6]` → `"0:6"`, `[0,2,3,4,5]` → `"0,2:5"`.
 */
export function format_ranges(nums: number[]): string {
  const sorted = [...nums].sort((a, b) => a - b);
  const tokens: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) {
      j++;
    }
    if (j === i) {
      tokens.push(String(sorted[i]));
    } else {
      tokens.push(`${sorted[i]}:${sorted[j]}`);
    }
    i = j + 1;
  }
  return tokens.join(",");
}

/**
 * Canonical signature of a role's member set: grant-delay plus the sorted
 * per-member addresses and exec-delays. Per-member `since` (the grant
 * timestamp) is excluded — it varies block-by-block for otherwise identical
 * grants and is immaterial to "same set of users".
 */
export function member_signature(role: RoleState): string {
  const entries = [...role.members.entries()].sort((a, b) =>
    a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0
  );
  const members = entries
    .map(([addr, m]) => `${addr}:${m.execDelay}`)
    .join(",");
  return `${role.grantDelay}|${members}`;
}

/**
 * A display row in an ACMA matrix: grouped name + representative role,
 * split into separate display columns.
 */
export type RoleRow = {
  name: string;
  tier: RoleTier;
  role: RoleState;
  /** first underscore token of the role name (e.g. FEED, POOL, VAULT). */
  first: string;
  /** middle tokens with the role suffix omitted (e.g. RETWAP, CAP_BORROW). */
  middle: string;
  /** formatted pool range without prefix/braces (e.g. "0:6"), empty when none. */
  pool: string;
};

/**
 * Strip the `_GUARD_ROLE`/`_ADMIN_ROLE`/`_ROLE` suffix from a role name.
 * Precedence matches `role_name`.
 */
export function strip_role_suffix(s: string): string {
  if (s.endsWith("_GUARD_ROLE")) {
    return s.slice(0, -"_GUARD_ROLE".length);
  }
  if (s.endsWith("_ADMIN_ROLE")) {
    return s.slice(0, -"_ADMIN_ROLE".length);
  }
  if (s.endsWith("_ROLE")) {
    return s.slice(0, -"_ROLE".length);
  }
  return s;
}

/**
 * Split a role name (role suffix removed) into its first underscore token and
 * the remaining middle parts.
 */
export function split_role_columns(
  core: string,
): { first: string; middle: string } {
  const idx = core.indexOf("_");
  if (idx < 0) {
    return { first: core, middle: "" };
  }
  return { first: core.slice(0, idx), middle: core.slice(idx + 1) };
}

/**
 * Group roles by their last `_PXYZ`-style suffix when granted to the same
 * set of users. Multi-role groups render as `BASE_P{0:6}`; single-role
 * groups and non-matching names keep their original name.
 */
export function group_roles(roles: RoleState[]): RoleRow[] {
  const buckets = new Map<
    string,
    {
      base: string;
      prefix: string;
      nums: number[];
      role: RoleState;
      tier: RoleTier;
      original: string;
    }
  >();
  const order: string[] = [];
  const rows: RoleRow[] = [];
  for (const role of roles) {
    const name = role_name(role);
    const parts = split_pool_suffix(name);
    if (!parts) {
      const { first, middle } = split_role_columns(name);
      rows.push({ name, tier: role.tier, role, first, middle, pool: "" });
      continue;
    }
    const key = `${role.tier}\0${parts.base}\0${parts.prefix}\0${
      member_signature(role)
    }`;
    const bucket = buckets.get(key);
    if (!bucket) {
      buckets.set(key, {
        base: parts.base,
        prefix: parts.prefix,
        nums: [parts.number],
        role,
        tier: role.tier,
        original: name,
      });
      order.push(key);
    } else {
      bucket.nums.push(parts.number);
    }
  }
  for (const key of order) {
    const b = buckets.get(key)!;
    const pool = format_ranges(b.nums);
    const core = strip_role_suffix(b.base);
    const { first, middle } = split_role_columns(core);
    const name = b.nums.length > 1
      ? `${b.base}_${b.prefix}{${pool}}`
      : b.original;
    rows.push({ name, tier: b.tier, role: b.role, first, middle, pool });
  }
  return rows.sort((a, b) =>
    TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || a.name.localeCompare(b.name)
  );
}

const TIER_ORDER: Record<RoleTier, number> = {
  exe: 0,
  adm: 1,
  grd: 2,
  sys: 3,
};

/**
 * Display label for the pool column: supra-pool roles (empty pool) render
 * as "any" rather than a blank cell.
 */
export function pool_display(pool: string): string {
  return pool === "" ? "any" : pool;
}
