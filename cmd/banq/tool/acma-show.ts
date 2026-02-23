import { type AcmaEvent, type AcmaState, ADMIN_ROLE } from "./acma-types.ts";
import {
  all_addresses,
  count_by_tier,
  role_name,
  roles_of,
  sorted_roles,
} from "./acma-state.ts";
import { prefix_by } from "../../../env/find-by.ts";
import {
  commas,
  format_delay,
  format_since,
  frame,
  type FrameSection,
  label_of,
  legend_label,
  pad_right,
  separator,
  short_label,
  vertical_headers,
} from "./acma-format.ts";

/**
 * `banq acma show` — compact authorization matrix.
 */
export function acma_show(
  state: AcmaState,
  block: number,
  options: { addresses: boolean },
): string {
  const addrs = all_addresses(state);
  const roles = sorted_roles(state).filter((r) => r.members.size > 0);
  const col_w = 2;
  const labels = addrs.map(short_label);
  // vertical headers
  const v_rows = vertical_headers(labels, col_w);
  // role name column width
  const name_w = Math.max(18, ...roles.map((r) => role_name(r).length));
  const tier_w = 4;
  // build header rows
  const prefix_w = name_w + 1 + tier_w + 1;
  const header_rows = v_rows.map((row) => " ".repeat(prefix_w) + row);
  // dot header row
  const dots = addrs.map(() => "·".padStart(Math.ceil(col_w / 2)).padEnd(col_w))
    .join("");
  const dot_row = pad_right("Role", name_w) + " " + pad_right("tier", tier_w) +
    " " +
    dots;
  // separator
  const sep_w = prefix_w + addrs.length * col_w;
  const sep = separator(sep_w);
  // group by tier
  const rows: string[] = [...header_rows, dot_row, sep];
  for (const [i, role] of roles.entries()) {
    if (i > 0 && roles[i - 1].tier !== role.tier) {
      rows.push(sep);
    }
    const name = pad_right(role_name(role), name_w);
    const tier = pad_right(role.tier, tier_w);
    const cells = addrs.map((addr) => {
      const mark = role.members.has(addr) ? "+" : "·";
      return mark.padStart(Math.ceil(col_w / 2)).padEnd(col_w);
    }).join("");
    rows.push(`${name} ${tier} ${cells}`);
  }
  // footer
  const counts = count_by_tier(state);
  const footer =
    `${addrs.length} addresses · ${counts.exe} exe · ${counts.adm} adm · ${counts.grd} grd · ${counts.sys} sys · ${
      commas(state.events.length)
    } events`;
  const sections: FrameSection[] = [{
    title: "ACMA Authorizations",
    meta: `block ${commas(block)} · ${state.roles.size} roles`,
    rows,
  }, {
    rows: [footer],
  }];
  // address legend
  if (options.addresses) {
    const addr_rows = addrs.map((a) => {
      const count = roles_of(state, a);
      return `${legend_label(a)}  ${count} role${count !== 1 ? "s" : ""}`;
    });
    sections.push({ rows: addr_rows });
  }
  return frame(sections);
}

/**
 * `banq acma roles` — all roles with metadata.
 */
export function acma_roles(state: AcmaState): string {
  const roles = sorted_roles(state);
  const name_w = Math.max(18, ...roles.map((r) => role_name(r).length));
  const header = pad_right("Role", name_w) + " " +
    pad_right("ID", 16) + "  " +
    pad_right("tier", 4) + "  " +
    pad_right("dt", 6) + " " +
    pad_right("adm", 3) + " " +
    pad_right("grd", 3);
  const sep = separator(header.length);
  const rows = [header, sep];
  for (const role of roles) {
    const name = pad_right(role_name(role), name_w);
    const id = role.id.toString(16).padStart(16, "0");
    const tier = pad_right(role.tier, 4);
    const delay = pad_right(format_delay(role.grantDelay), 6);
    const has_adm = role.adminRole !== 0n ? "+" : "·";
    const has_grd = role.guardRole !== 0n ? "+" : "·";
    rows.push(
      `${name} ${id}  ${tier}  ${delay} ${pad_right(has_adm, 3)} ${
        pad_right(has_grd, 3)
      }`,
    );
  }
  return frame([{
    title: "ACMA Roles",
    meta: `${roles.length} roles`,
    rows,
  }]);
}

/**
 * `banq acma members` — matrix with exec-delay values.
 */
export function acma_members(
  state: AcmaState,
  options: { addresses: boolean },
): string {
  const addrs = all_addresses(state);
  const roles = sorted_roles(state).filter((r) => r.members.size > 0);
  const col_w = 3;
  const labels = addrs.map(short_label);
  const v_rows = vertical_headers(labels, col_w);
  const name_w = Math.max(16, ...roles.map((r) => role_name(r).length));
  const tier_w = 4;
  const prefix_w = name_w + 1 + tier_w + 1;
  const header_rows = v_rows.map((row) => " ".repeat(prefix_w) + row);
  const dots = addrs.map(() => "·".padStart(Math.ceil(col_w / 2)).padEnd(col_w))
    .join("");
  const dot_row = pad_right("Role", name_w) + " " + pad_right("tier", tier_w) +
    " " +
    dots;
  const sep_w = prefix_w + addrs.length * col_w;
  const sep = separator(sep_w);
  const rows: string[] = [...header_rows, dot_row, sep];
  for (const [i, role] of roles.entries()) {
    if (i > 0 && roles[i - 1].tier !== role.tier) {
      rows.push(sep);
    }
    const name = pad_right(role_name(role), name_w);
    const tier = pad_right(role.tier, tier_w);
    const cells = addrs.map((addr) => {
      const m = role.members.get(addr);
      const val = m ? format_delay(m.execDelay) : "·";
      return val.padStart(Math.ceil(col_w / 2)).padEnd(col_w);
    }).join("");
    rows.push(`${name} ${tier} ${cells}`);
  }
  const sections: FrameSection[] = [{
    title: "ACMA Members",
    meta: `${addrs.length} addresses`,
    rows,
  }];
  if (options.addresses) {
    const addr_rows = addrs.map((a) => legend_label(a));
    sections.push({ rows: addr_rows });
  }
  return frame(sections);
}

/**
 * `banq acma targets` — function-to-role mappings.
 */
export function acma_targets(state: AcmaState): string {
  const targets = [...state.targets.values()].sort((a, b) =>
    a.address < b.address ? -1 : a.address > b.address ? 1 : 0
  );
  const fn_count = targets.reduce((sum, t) => sum + t.functions.size, 0);
  const rows: string[] = [];
  for (const target of targets) {
    const lbl = legend_label(target.address);
    const delay_s = format_delay(target.adminDelay);
    rows.push(`${lbl}  adm·dt=${delay_s}`);
    rows.push(separator(48));
    for (const [sel, roleId] of target.functions) {
      const role = state.roles.get(roleId);
      const rn = role ? role_name(role) : roleId.toString(16);
      rows.push(`  ${sel} => ${rn}`);
    }
    rows.push("");
  }
  return frame([{
    title: "ACMA Targets",
    meta: `${fn_count} fn=>role`,
    rows,
  }]);
}

/**
 * `banq acma hierarchy` — admin/guard tree for exec roles.
 */
export function acma_hierarchy(state: AcmaState): string {
  const roles = sorted_roles(state).filter((r) => r.tier === "exe");
  const name_w = Math.max(18, ...roles.map((r) => role_name(r).length));
  const header = pad_right("Exe Role", name_w) + " " +
    pad_right("Adm Role", name_w) + " " +
    pad_right("Grd Role", name_w);
  const sep = separator(header.length);
  const rows = [header, sep];
  const unique_adm = new Set<bigint>();
  const unique_grd = new Set<bigint>();
  for (const role of roles) {
    const adm = state.roles.get(role.adminRole);
    const grd = state.roles.get(role.guardRole);
    const adm_name = adm ? role_name(adm) : "·";
    const grd_name = grd ? role_name(grd) : "·";
    rows.push(
      `${pad_right(role_name(role), name_w)} ${pad_right(adm_name, name_w)} ${
        pad_right(grd_name, name_w)
      }`,
    );
    unique_adm.add(role.adminRole);
    unique_grd.add(role.guardRole);
  }
  const admin_governed = roles.filter((r) => r.adminRole === ADMIN_ROLE).length;
  const self_governed = roles.length - admin_governed;
  const footer =
    `${self_governed} self-governed · ${admin_governed} ADMIN-governed`;
  return frame([{
    title: "ACMA Hierarchy",
    meta:
      `${roles.length} exe · ${unique_adm.size} adm · ${unique_grd.size} grd`,
    rows,
  }, {
    rows: [footer],
  }]);
}

/**
 * `banq acma delays` — grant-delays and target admin-delays.
 */
export function acma_delays(
  state: AcmaState,
  options: { addresses: boolean },
): string {
  const roles = sorted_roles(state);
  const name_w = Math.max(18, ...roles.map((r) => role_name(r).length));
  const header1 = pad_right("Role", name_w) + " " + pad_right("tier", 4) +
    "  " +
    pad_right("grant·dt", 10);
  const sep1 = separator(header1.length);
  const role_rows = [header1, sep1];
  for (const role of roles) {
    role_rows.push(
      `${pad_right(role_name(role), name_w)} ${pad_right(role.tier, 4)}  ${
        pad_right(format_delay(role.grantDelay), 10)
      }`,
    );
  }
  const all_targets = [...state.targets.values()].sort((a, b) =>
    a.address < b.address ? -1 : a.address > b.address ? 1 : 0
  );
  const targets = options.addresses ? all_targets : all_targets
    .filter((t) => prefix_by(t.address) !== undefined)
    .sort((a, b) => {
      const la = prefix_by(a.address)!;
      const lb = prefix_by(b.address)!;
      return la < lb ? -1 : la > lb ? 1 : 0;
    });
  const header2 = pad_right("Target", 28) + "  " +
    pad_right("adm·dt", 10);
  const sep2 = separator(header2.length);
  const tgt_rows = [header2, sep2];
  for (const tgt of targets) {
    const lbl = legend_label(tgt.address);
    tgt_rows.push(
      `${pad_right(lbl, 28)}  ${pad_right(format_delay(tgt.adminDelay), 10)}`,
    );
  }
  const tgt_meta = options.addresses
    ? `${targets.length} targets`
    : `${targets.length} of ${all_targets.length} targets`;
  return frame([{
    title: "ACMA Grant dt",
    meta: `${roles.length} roles`,
    rows: role_rows,
  }, {
    title: "ACMA Target Adm dt",
    meta: tgt_meta,
    rows: tgt_rows,
  }]);
}

/**
 * Map from spec filter names (--event values) to internal AcmaEventKind.
 * Accepts both full spec names and abbreviated display names.
 */
const EVENT_FILTER_MAP: Record<string, string> = {
  // spec names → internal kinds
  "operation-scheduled": "op·sched",
  "operation-executed": "op·exec",
  "operation-canceled": "op·cancel",
  "admin-changed": "adm-set",
  "guardian-changed": "grd-set",
  "grant-delay": "grant·dt",
  "function-role": "fn-role",
  "target-delay": "tgt·dt",
  "target-closed": "closed",
  // pass-through for abbreviated names and simple names
  "granted": "granted",
  "revoked": "revoked",
  "labeled": "labeled",
  "adm-set": "adm-set",
  "grd-set": "grd-set",
  "grant·dt": "grant·dt",
  "fn-role": "fn-role",
  "tgt·dt": "tgt·dt",
  "closed": "closed",
  "op·sched": "op·sched",
  "op·exec": "op·exec",
  "op·cancel": "op·cancel",
};

/**
 * `banq acma logs` — chronological event log with filters.
 */
export function acma_logs(
  state: AcmaState,
  options: AcmaLogOptions,
): string {
  const filtered = filter_events([...state.events], options, state);
  const sorted = options.asc ? filtered : [...filtered].reverse();
  const total = sorted.length;
  const events = options.limit > 0 ? sorted.slice(0, options.limit) : sorted;
  // format rows
  const rows: string[] = [];
  const header = pad_right("block", 12) + " " +
    pad_right("idx", 3) + " " +
    pad_right("kind", 10) + " " +
    "detail";
  rows.push(header);
  rows.push(separator(header.length + 40));
  for (const ev of events) {
    const blk = commas(ev.block).padStart(12);
    const idx = String(ev.logIndex).padStart(3, "0");
    const kind = pad_right(ev.kind, 10);
    const detail = format_detail(state, ev, options);
    const row = options.tx
      ? `${blk} ${idx} ${ev.txHash.slice(0, 10)}.. ${kind} ${detail}`
      : `${blk} ${idx} ${kind} ${detail}`;
    rows.push(row);
  }
  const shown = events.length;
  const footer_text = shown < total
    ? `${shown} of ${commas(total)} events`
    : `${commas(total)} events`;
  return frame([{
    title: "ACMA Logs",
    meta: `${shown} of ${commas(total)} events`,
    rows,
  }, {
    rows: [footer_text],
  }]);
}

export type AcmaLogOptions = {
  address_filter: bigint | undefined;
  asc: boolean;
  event_filter: string[];
  limit: number;
  role_filter: string | undefined;
  timestamps: boolean;
  tx: boolean;
};

function filter_events(
  events: AcmaEvent[],
  options: AcmaLogOptions,
  state: AcmaState,
): AcmaEvent[] {
  const has_event = options.event_filter && options.event_filter.length > 0;
  const kinds = has_event
    ? new Set(options.event_filter.map((f) => EVENT_FILTER_MAP[f] ?? f))
    : null;
  const rx = options.role_filter ? new RegExp(options.role_filter, "i") : null;
  const addr = options.address_filter;
  return events.filter((e) => {
    if (kinds && !kinds.has(e.kind)) return false;
    if (rx) {
      if (e.roleId === undefined) return false;
      const role = state.roles.get(e.roleId);
      if (!role) return false;
      if (!rx.test(role.label) && !rx.test(role_name(role))) return false;
    }
    if (addr !== undefined) {
      if (e.account !== addr && e.target !== addr && e.caller !== addr) {
        return false;
      }
    }
    return true;
  });
}

function format_detail(
  state: AcmaState,
  ev: AcmaEvent,
  _options: AcmaLogOptions,
): string {
  switch (ev.kind) {
    case "granted": {
      const role = state.roles.get(ev.roleId!);
      const rn = role ? role_name(role) : ev.roleId!.toString(16);
      const acct = label_of(ev.account!);
      const delay_s = format_delay(ev.delay!);
      const since_s = format_since(ev.since!);
      return `${rn} ${acct} exe·dt=${delay_s} since=${since_s}`;
    }
    case "revoked": {
      const role = state.roles.get(ev.roleId!);
      const rn = role ? role_name(role) : ev.roleId!.toString(16);
      const acct = label_of(ev.account!);
      return `${rn} ${acct}`;
    }
    case "labeled": {
      return `${ev.label}`;
    }
    case "adm-set": {
      const role = state.roles.get(ev.roleId!);
      const rn = role ? role_name(role) : ev.roleId!.toString(16);
      const adm = state.roles.get(ev.admin!);
      const an = adm ? role_name(adm) : ev.admin!.toString(16);
      return `${rn} adm=${an}`;
    }
    case "grd-set": {
      const role = state.roles.get(ev.roleId!);
      const rn = role ? role_name(role) : ev.roleId!.toString(16);
      const grd = state.roles.get(ev.guardian!);
      const gn = grd ? role_name(grd) : ev.guardian!.toString(16);
      return `${rn} grd=${gn}`;
    }
    case "grant·dt": {
      const role = state.roles.get(ev.roleId!);
      const rn = role ? role_name(role) : ev.roleId!.toString(16);
      const delay_s = format_delay(ev.delay!);
      const since_s = format_since(ev.since!);
      return `${rn} dt=${delay_s} since=${since_s}`;
    }
    case "fn-role": {
      const tgt = label_of(ev.target!);
      const role = state.roles.get(ev.roleId!);
      const rn = role ? role_name(role) : ev.roleId!.toString(16);
      return `${tgt}.${ev.selector} role=${rn}`;
    }
    case "tgt·dt": {
      const tgt = label_of(ev.target!);
      const delay_s = format_delay(ev.delay!);
      const since_s = format_since(ev.since!);
      return `${tgt} dt=${delay_s} since=${since_s}`;
    }
    case "closed": {
      const tgt = label_of(ev.target!);
      return `${tgt} closed=${ev.closed}`;
    }
    case "op·sched": {
      const id = ev.operationId!.slice(0, 6) + ".." + ev.operationId!.slice(-4);
      const caller = label_of(ev.caller!);
      const tgt = label_of(ev.target!);
      return `id=${id} caller=${caller} target=${tgt}`;
    }
    case "op·exec": {
      const id = ev.operationId!.slice(0, 6) + ".." + ev.operationId!.slice(-4);
      return `id=${id} nonce=${ev.nonce}`;
    }
    case "op·cancel": {
      const id = ev.operationId!.slice(0, 6) + ".." + ev.operationId!.slice(-4);
      return `id=${id} nonce=${ev.nonce}`;
    }
    default:
      return "";
  }
}
