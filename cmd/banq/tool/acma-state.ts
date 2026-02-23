import type {
  AcmaEvent,
  AcmaState,
  MemberState,
  RoleState,
  RoleTier,
  TargetState,
} from "./acma-types.ts";
import { ADMIN_ROLE, PUBLIC_ROLE } from "./acma-types.ts";

/**
 * Reconstruct the current ACMA state by replaying events in order.
 */
export function reconstruct(events: AcmaEvent[]): AcmaState {
  const roles = new Map<bigint, RoleState>();
  const targets = new Map<bigint, TargetState>();
  // ensure builtins exist
  ensure_role(roles, ADMIN_ROLE);
  ensure_role(roles, PUBLIC_ROLE);
  for (const ev of events) {
    switch (ev.kind) {
      case "granted":
        apply_granted(roles, ev);
        break;
      case "revoked":
        apply_revoked(roles, ev);
        break;
      case "labeled":
        apply_labeled(roles, ev);
        break;
      case "adm-set":
        apply_admin_changed(roles, ev);
        break;
      case "grd-set":
        apply_guardian_changed(roles, ev);
        break;
      case "grant·dt":
        apply_grant_delay(roles, ev);
        break;
      case "fn-role":
        apply_function_role(roles, targets, ev);
        break;
      case "tgt·dt":
        apply_target_delay(targets, ev);
        break;
      case "closed":
        apply_target_closed(targets, ev);
        break;
        // operation events don't mutate state
    }
  }
  return { roles, targets, events };
}

function ensure_role(
  roles: Map<bigint, RoleState>,
  id: bigint,
): RoleState {
  const existing = roles.get(id);
  if (existing) return existing;
  const role: RoleState = {
    id,
    label: default_label(id),
    tier: default_tier(id),
    adminRole: ADMIN_ROLE,
    guardRole: ADMIN_ROLE,
    grantDelay: 0,
    grantDelaySince: 0,
    members: new Map(),
  };
  roles.set(id, role);
  return role;
}

function default_label(id: bigint): string {
  if (id === ADMIN_ROLE) {
    return "ADMIN_ROLE";
  }
  if (id === PUBLIC_ROLE) {
    return "PUBLIC_ROLE";
  }
  return `ROLE_${id.toString(16).padStart(16, "0")}`;
}

function default_tier(id: bigint): RoleTier {
  if (id === ADMIN_ROLE || id === PUBLIC_ROLE) {
    return "sys";
  }
  return "exe";
}

function apply_granted(
  roles: Map<bigint, RoleState>,
  ev: AcmaEvent,
): void {
  const role = ensure_role(roles, ev.roleId!);
  role.members.set(ev.account!, {
    execDelay: ev.delay!,
    since: ev.since!,
  });
}

function apply_revoked(
  roles: Map<bigint, RoleState>,
  ev: AcmaEvent,
): void {
  const role = ensure_role(roles, ev.roleId!);
  role.members.delete(ev.account!);
}

function apply_labeled(
  roles: Map<bigint, RoleState>,
  ev: AcmaEvent,
): void {
  const role = ensure_role(roles, ev.roleId!);
  role.label = ev.label!;
  // infer tier from label suffix
  if (ev.label!.endsWith("_GUARD_ROLE")) {
    role.tier = "grd";
  } else if (ev.label!.endsWith("_ADMIN_ROLE")) {
    role.tier = "adm";
  } else if (ev.label!.endsWith("_ROLE")) {
    role.tier = "exe";
  }
}

function apply_admin_changed(
  roles: Map<bigint, RoleState>,
  ev: AcmaEvent,
): void {
  const role = ensure_role(roles, ev.roleId!);
  role.adminRole = ev.admin!;
}

function apply_guardian_changed(
  roles: Map<bigint, RoleState>,
  ev: AcmaEvent,
): void {
  const role = ensure_role(roles, ev.roleId!);
  role.guardRole = ev.guardian!;
}

function apply_grant_delay(
  roles: Map<bigint, RoleState>,
  ev: AcmaEvent,
): void {
  const role = ensure_role(roles, ev.roleId!);
  role.grantDelay = ev.delay!;
  role.grantDelaySince = ev.since!;
}

function ensure_target(
  targets: Map<bigint, TargetState>,
  address: bigint,
): TargetState {
  const existing = targets.get(address);
  if (existing) return existing;
  const target: TargetState = {
    address,
    closed: false,
    adminDelay: 0,
    adminDelaySince: 0,
    functions: new Map(),
  };
  targets.set(address, target);
  return target;
}

function apply_function_role(
  roles: Map<bigint, RoleState>,
  targets: Map<bigint, TargetState>,
  ev: AcmaEvent,
): void {
  ensure_role(roles, ev.roleId!);
  const target = ensure_target(targets, ev.target!);
  target.functions.set(ev.selector!, ev.roleId!);
}

function apply_target_delay(
  targets: Map<bigint, TargetState>,
  ev: AcmaEvent,
): void {
  const target = ensure_target(targets, ev.target!);
  target.adminDelay = ev.delay!;
  target.adminDelaySince = ev.since!;
}

function apply_target_closed(
  targets: Map<bigint, TargetState>,
  ev: AcmaEvent,
): void {
  const target = ensure_target(targets, ev.target!);
  target.closed = ev.closed!;
}

/**
 * Get the display name for a role, stripping _ROLE suffix.
 */
export function role_name(role: RoleState): string {
  const label = role.label;
  if (role.id === ADMIN_ROLE) {
    return "ADMIN";
  }
  if (role.id === PUBLIC_ROLE) {
    return "PUBLIC";
  }
  // strip _GUARD_ROLE, _ADMIN_ROLE, _ROLE suffix
  if (label.endsWith("_GUARD_ROLE")) {
    return label.slice(0, -"_GUARD_ROLE".length);
  }
  if (label.endsWith("_ADMIN_ROLE")) {
    return label.slice(0, -"_ADMIN_ROLE".length);
  }
  if (label.endsWith("_ROLE")) {
    return label.slice(0, -"_ROLE".length);
  }
  return label;
}

/**
 * Get roles sorted by tier then label.
 */
export function sorted_roles(state: AcmaState): RoleState[] {
  const tier_order: Record<RoleTier, number> = {
    exe: 0,
    adm: 1,
    grd: 2,
    sys: 3,
  };
  return [...state.roles.values()].sort((a, b) => {
    const t = tier_order[a.tier] - tier_order[b.tier];
    if (t !== 0) {
      return t;
    }
    return role_name(a).localeCompare(role_name(b));
  });
}

/**
 * Get all unique member addresses across all roles.
 */
export function all_addresses(state: AcmaState): bigint[] {
  const set = new Set<bigint>();
  for (const role of state.roles.values()) {
    for (const addr of role.members.keys()) {
      set.add(addr);
    }
  }
  return [...set].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Count roles per tier.
 */
export function count_by_tier(
  state: AcmaState,
): Record<RoleTier, number> {
  const counts: Record<RoleTier, number> = {
    exe: 0,
    adm: 0,
    grd: 0,
    sys: 0,
  };
  for (const role of state.roles.values()) {
    if (role.members.size > 0) {
      counts[role.tier]++;
    }
  }
  return counts;
}

/**
 * Count roles assigned to a specific address.
 */
export function roles_of(state: AcmaState, address: bigint): number {
  return [...state.roles.values()].filter((r) => r.members.has(address)).length;
}

/**
 * Get MemberState for a role+address pair, if any.
 */
export function member_of(
  role: RoleState,
  address: bigint,
): MemberState | undefined {
  return role.members.get(address);
}
