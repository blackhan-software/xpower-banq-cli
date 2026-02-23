import { opt_contract_run } from "../../arg/opt-contract-run.ts";
import { ArgumentError } from "../../arg/types.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import { address_by } from "../../env/find-by.ts";
import type { Spinner } from "../../etc/cli-spinner.ts";
import { addressOf as x } from "../../function/address.ts";
import { as_bigint } from "../../function/as-bigint.ts";
import { wallet } from "../../wallet/index.ts";
import { type CommandResult, DRY_RUN } from "../types.ts";

import {
  events_from_cache,
  load_cache,
  save_cache,
} from "./tool/acma-cache.ts";
import {
  fetch_logs,
  find_deploy_block,
  MAX_BLOCKS_DEFAULT,
} from "./tool/acma-events.ts";
import {
  acma_delays,
  acma_hierarchy,
  acma_logs,
  acma_members,
  acma_roles,
  acma_show,
  acma_targets,
  type AcmaLogOptions,
} from "./tool/acma-show.ts";
import { reconstruct } from "./tool/acma-state.ts";
import {
  ACMA_SUBCMDS,
  type AcmaEvent,
  type AcmaState,
  type AcmaSubcommand,
} from "./tool/acma-types.ts";
import { list_options } from "./tool/completions.ts";

/**
 * acma [sub-command] [--options]
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
    list_options(
      [...ACMA_SUBCMDS],
      [
        "--acma",
        "--from-block",
        "--max-blocks",
        "--to-block",
        "--no-cache",
        "--contract-run",
        "-V",
        "--addresses",
        "-a",
        "--json",
        "-j",
      ],
      [
        "--event",
        "-e",
        "--role",
        "-r",
        "--address",
        "--asc",
        "--limit",
        "-n",
        "--timestamps",
        "--tx",
      ],
    );
  }
  ///
  /// parse sub-command
  ///
  const sub = parse_sub(args);
  if (!args.broadcast) {
    return [[sub], [DRY_RUN]];
  }
  ///
  /// resolve ACMA address and fetch event logs
  ///
  const acma_addr = resolve_acma_address(args);
  const { signer } = await wallet(args, true);
  const provider = signer.provider!;
  const network = await provider.getNetwork();
  const chain_id = Number(network.chainId);
  const latest = await provider.getBlockNumber();
  const to_block = args.to_block ?? latest;
  const max_blocks = args.max_blocks ?? MAX_BLOCKS_DEFAULT;
  const on_block = on_block_factory(args.spinner);
  const acma_hex = x(acma_addr);
  const events = await scan_events({
    provider,
    acma_hex,
    chain_id,
    to_block,
    max_blocks,
    no_cache: args.no_cache,
    from_block_arg: args.from_block,
    on_block,
  });
  if (args.spinner) args.spinner.text = "%s";
  ///
  /// reconstruct state and format output
  ///
  const state = reconstruct(events);
  const addresses_flag = Boolean(args.addresses);
  if (args.json) {
    // emit raw JSON state
    return [[sub], [JSON.stringify({
      events: state.events.length,
      roles: [...state.roles.values()].map((r) => ({
        adminRole: r.adminRole.toString(),
        grantDelay: r.grantDelay,
        guardRole: r.guardRole.toString(),
        id: r.id.toString(),
        label: r.label,
        members: [...r.members.entries()].map(([addr, m]) => ({
          address: addr.toString(),
          execDelay: m.execDelay,
          since: m.since,
        })),
        tier: r.tier,
      })),
      targets: [...state.targets.values()].map((t) => ({
        address: t.address.toString(),
        adminDelay: t.adminDelay,
        closed: t.closed,
        functions: [...t.functions.entries()].map(([sel, roleId]) => ({
          roleId: roleId.toString(),
          selector: sel,
        })),
      })),
    })]];
  }
  const output = format_output(
    sub,
    state,
    latest,
    addresses_flag,
    args,
  );
  return [[sub], [output]];
}

const ACMA_SUBCMDS_SET = new Set<string>(ACMA_SUBCMDS);

function parse_sub(args: BanqArgs): AcmaSubcommand {
  if (
    args.rest.length > 0 &&
    typeof args.rest[0] === "string" &&
    ACMA_SUBCMDS_SET.has(args.rest[0] as string)
  ) {
    return args.rest.shift() as AcmaSubcommand;
  }
  return "show";
}

interface ScanParams {
  provider: import("ethers").Provider;
  acma_hex: string;
  chain_id: number;
  to_block: number;
  max_blocks: number;
  no_cache: boolean;
  from_block_arg: number | undefined;
  on_block: ((cursor: number, from: number, to: number) => void) | undefined;
}

async function scan_events(sps: ScanParams): Promise<AcmaEvent[]> {
  const { provider, acma_hex, chain_id, to_block, max_blocks, on_block } = sps;
  const { no_cache, from_block_arg } = sps;
  if (no_cache) {
    const from = from_block_arg ??
      await find_deploy_block(provider, acma_hex);
    return fetch_logs(provider, acma_hex, from, to_block, max_blocks, on_block);
  }
  const cache = load_cache(chain_id, acma_hex);
  if (cache) {
    const from = from_block_arg ?? cache.fromBlock;
    if (from >= cache.fromBlock && to_block <= cache.toBlock) {
      // cache fully covers the requested range — no fetch needed
      return events_from_cache(cache).filter(
        (e) => e.block >= from && e.block <= to_block,
      );
    }
    if (from >= cache.fromBlock) {
      // cache covers the start — incremental fetch beyond cache.toBlock
      const all_cached = events_from_cache(cache);
      const on_batch = (new_events: AcmaEvent[], scanned_to: number) => {
        if (new_events.length > 0) {
          save_cache(chain_id, acma_hex, cache.fromBlock, scanned_to, [
            ...all_cached,
            ...new_events,
          ]);
        }
      };
      const new_events = await fetch_logs(
        provider,
        acma_hex,
        cache.toBlock + 1,
        to_block,
        max_blocks,
        on_block,
        on_batch,
      );
      all_cached.push(...new_events);
      if (new_events.length > 0) {
        save_cache(chain_id, acma_hex, cache.fromBlock, to_block, all_cached);
      }
      return all_cached.filter((e) => e.block >= from);
    }
    // from < cache.fromBlock — need earlier blocks, full rescan
  }
  // no usable cache — full scan with progressive saving
  const from = from_block_arg ??
    await find_deploy_block(provider, acma_hex);
  const on_batch = (events: AcmaEvent[], scanned_to: number) => {
    save_cache(chain_id, acma_hex, from, scanned_to, events);
  };
  const events = await fetch_logs(
    provider,
    acma_hex,
    from,
    to_block,
    max_blocks,
    on_block,
    on_batch,
  );
  save_cache(chain_id, acma_hex, from, to_block, events);
  return events;
}

function format_output(
  sub: AcmaSubcommand,
  state: AcmaState,
  latest: number,
  addresses: boolean,
  args: BanqArgs,
): string {
  switch (sub) {
    case "show":
      return acma_show(state, latest, { addresses });
    case "roles":
      return acma_roles(state);
    case "members":
      return acma_members(state, { addresses });
    case "targets":
      return acma_targets(state);
    case "hierarchy":
      return acma_hierarchy(state);
    case "delays":
      return acma_delays(state, { addresses });
    case "logs":
      return acma_logs(state, parse_log_options(args));
  }
}

function resolve_acma_address(args: BanqArgs): bigint {
  // check args for --acma option
  if (args.acma) {
    if (typeof args.acma === "bigint") {
      return args.acma;
    }
    const n = as_bigint(String(args.acma));
    if (n !== undefined) {
      return n;
    }
  }
  // fallback to env (versioned: ACMA_ADDRESS_v10a / ACMA_ADDRESS_v10b)
  const { contract_run } = opt_contract_run(args);
  const addr = address_by("ACMA", contract_run);
  if (addr !== undefined) {
    return addr;
  }
  throw new ArgumentError(
    "missing ACMA address: use --acma or set ACMA_ADDRESS_{version} in .env",
  );
}

function parse_log_options(args: BanqArgs): AcmaLogOptions {
  const event_filter = args.event
    ? String(args.event).split(",").map((s: string) => s.trim())
    : [];
  const role_filter = args.role ?? undefined;
  const address_filter = resolve_address_filter(args.address);
  return {
    address_filter: address_filter,
    asc: Boolean(args.asc),
    event_filter,
    limit: args.limit ?? 50,
    role_filter,
    timestamps: Boolean(args.timestamps),
    tx: Boolean(args.tx),
  };
}

function resolve_address_filter(
  address: bigint | string | undefined,
): bigint | undefined {
  if (!address) {
    return undefined;
  }
  if (typeof address === "bigint") {
    return address;
  }
  return as_bigint(String(address));
}

function on_block_factory(spinner: Spinner | undefined) {
  if (spinner) {
    return (cursor: number, from: number, to: number) => {
      const percent = to > from
        ? ((cursor - from) / (to - from) * 100).toFixed(2)
        : "0.00";
      const percent_pad = percent.padStart(5, "0");
      const cursor_txt = cursor.toLocaleString("en-US");
      spinner.text = `%s ${cursor_txt} [${percent_pad}%]`;
    };
  }
}
