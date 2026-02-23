import { ethers, isAddress, isCallException } from "ethers";
import { pool_abi, position_abi } from "./abi/abis.ts";

import { arg_token } from "../../arg/arg-token.ts";
import { opt_contract_run } from "../../arg/opt-contract-run.ts";
import { opt_gas } from "../../arg/opt-gas.ts";
import { opt_mode } from "../../arg/opt-mode.ts";
import { opt_pool } from "../../arg/opt-pool.ts";
import { opt_watch } from "../../arg/opt-watch.ts";
import type { Mode, RunVersion } from "../../arg/types.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../function/address.ts";
import { assert } from "../../function/assert.ts";
import { uuidv5 } from "../../function/uuidv5.ts";
import { wallet } from "../../wallet/index.ts";
import type { Argument } from "../types.ts";
import { BROADCAST, type CommandResult, DRY_RUN } from "../types.ts";

import { blockRange } from "./tool/block-range.ts";
import { blockSearch } from "./tool/block-search.ts";
import { list_options } from "./tool/completions.ts";
import { my, positionOf } from "./tool/position-of.ts";

/**
 * reindex $TOKEN --mode={supply,borrow} [--watch|--watch=<RANGE>] [--options]
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
    list_options(
      ["APOW", "XPOW"],
      [
        "--mode=supply",
        "--mode=borrow",
        "-M",
        "--pool",
        "-p",
        "--watch=",
        "--watch",
        "-w",
      ],
    );
  }
  const [watch, range] = opt_watch(args);
  if (watch && range && range[1] === Infinity) {
    return await execute_watch_all(args, range[0]);
  }
  if (watch && range) {
    return await execute_watch_in(args, range);
  }
  if (watch) {
    return await execute_watch(args);
  } else {
    return await execute(args);
  }
}
async function execute_watch_all(
  args: BanqArgs,
  dlt: number,
): Promise<CommandResult> {
  const { address: token, symbol } = arg_token(args, args.rest);
  const { address: pool } = opt_pool(args);
  const { mode } = opt_mode(args);
  if (!args.broadcast) {
    return [[my(symbol, mode), JSON.stringify([dlt, Infinity])], [DRY_RUN]];
  }
  const { contract_run: run } = opt_contract_run(args);
  const { signer } = await wallet(args, true);
  ///
  /// reindex token --watch=DLT@Infinity
  ///
  const POOL = new ethers.Contract(x(pool), pool_abi(run), signer);
  const error_args = [my(symbol, mode), JSON.stringify([dlt, Infinity])];
  const result = await resolve_position(POOL, token, mode, error_args);
  if (Array.isArray(result)) return result;
  const POSITION = new ethers.Contract(
    result.position,
    position_abi(run),
    signer,
  );
  const provider = signer.provider;
  assert(provider, "missing provider");
  const deploy_block = await blockSearch(provider, result.position);
  const block_number = await provider.getBlockNumber();
  for (
    let cursor = deploy_block;
    cursor <= block_number;
    cursor += dlt
  ) {
    const chunk_end = Math.min(cursor + dlt - 1, block_number);
    const event_logs = await POSITION.queryFilter(
      "Reindex",
      cursor,
      chunk_end,
    );
    for (const ev_log of event_logs as ethers.EventLog[]) {
      const [index, util_wad, stamp] = ev_log.args ?? [0n, 0n, 0n];
      console.log(JSON.stringify({
        id: uuidv5(JSON.stringify(ev_log)),
        filter: "Reindex",
        ...index_log(index, run),
        util_wad,
        stamp,
        symbol,
        token: x(token),
        mode,
        log: ev_log,
      }));
    }
  }
  return [[my(symbol, mode), JSON.stringify([dlt, Infinity])], [BROADCAST]];
}
async function execute_watch_in(
  args: BanqArgs,
  range: [number, number?],
): Promise<CommandResult> {
  const { address: token, symbol } = arg_token(args, args.rest);
  const { address: pool } = opt_pool(args);
  const { mode } = opt_mode(args);
  if (!args.broadcast) {
    return [[my(symbol, mode), JSON.stringify(range)], [DRY_RUN]];
  }
  const { contract_run: run } = opt_contract_run(args);
  const { signer } = await wallet(args, true);
  ///
  /// reindex token --watch=DLT or --watch=DLT@IDX
  ///
  const POOL = new ethers.Contract(x(pool), pool_abi(run), signer);
  const error_args = [my(symbol, mode), JSON.stringify(range)];
  const result = await resolve_position(POOL, token, mode, error_args);
  if (Array.isArray(result)) return result;
  const POSITION = new ethers.Contract(
    result.position,
    position_abi(run),
    signer,
  );
  const provider = signer.provider;
  assert(provider, "missing provider");
  const block_number = await provider.getBlockNumber();
  const [lhs_block, rhs_block] = blockRange(block_number, range);
  const event_logs = await POSITION.queryFilter(
    "Reindex",
    lhs_block,
    rhs_block,
  );
  for (const ev_log of event_logs as ethers.EventLog[]) {
    const [index, util_wad, stamp] = ev_log.args ?? [0n, 0n, 0n];
    console.log(JSON.stringify({
      id: uuidv5(JSON.stringify(ev_log)),
      filter: "Reindex",
      ...index_log(index, run),
      util_wad,
      stamp,
      symbol,
      token: x(token),
      mode,
      log: ev_log,
    }));
  }
  return [[my(symbol, mode), JSON.stringify(range)], [BROADCAST]];
}
async function execute_watch(
  args: BanqArgs,
): Promise<CommandResult> {
  const { address: token, symbol } = arg_token(args, args.rest);
  const { address: pool } = opt_pool(args);
  const { mode } = opt_mode(args);
  if (!args.broadcast) {
    return [[my(symbol, mode), true], [DRY_RUN]];
  }
  const { contract_run: run } = opt_contract_run(args);
  const { signer } = await wallet(args, true);
  ///
  /// reindex token --watch
  ///
  const POOL = new ethers.Contract(x(pool), pool_abi(run), signer);
  const error_args = [my(symbol, mode), true];
  const result = await resolve_position(POOL, token, mode, error_args);
  if (Array.isArray(result)) return result;
  const POSITION = new ethers.Contract(
    result.position,
    position_abi(run),
    signer,
  );
  const provider = signer.provider;
  assert(provider, "missing provider");
  return await new Promise((_, reject) => {
    provider.on("error", reject);
    POSITION.on("Reindex", (
      index,
      util_wad,
      stamp,
      ev,
    ) => {
      try {
        console.log(JSON.stringify({
          id: uuidv5(JSON.stringify(ev.log)),
          filter: ev.filter,
          ...index_log(index, run),
          util_wad,
          stamp,
          symbol,
          token: x(token),
          mode,
          log: ev.log,
        }));
      } catch (e) {
        console.error(e);
      }
    });
  });
}
async function execute(
  args: BanqArgs,
): Promise<CommandResult> {
  const { address: token, symbol } = arg_token(args, args.rest);
  const { address: pool } = opt_pool(args);
  const { mode } = opt_mode(args);
  if (!args.broadcast) {
    return [[my(symbol, mode), false], [DRY_RUN]];
  }
  const { signer } = await wallet(args);
  ///
  /// reindex token
  ///
  const { contract_run: run } = opt_contract_run(args);
  const POOL = new ethers.Contract(x(pool), pool_abi(run), signer);
  const error_args = [my(symbol, mode), false];
  const result = await resolve_position(POOL, token, mode, error_args);
  if (Array.isArray(result)) return result;
  const POSITION = new ethers.Contract(
    result.position,
    position_abi(run),
    signer,
  );
  try {
    await POSITION.reindex(opt_gas(args));
  } catch (e) {
    if (isCallException(e)) {
      return [[my(symbol, mode)], [e.reason]];
    }
    throw e;
  }
  return [[my(symbol, mode), false], [BROADCAST]];
}
async function resolve_position(
  POOL: ethers.Contract,
  token: bigint,
  mode: Mode,
  error_args: Argument[],
): Promise<{ position: string } | CommandResult> {
  try {
    const position = await positionOf(POOL, token, mode);
    assert(isAddress(position), "invalid address");
    return { position: position as string };
  } catch (e) {
    if (isCallException(e)) return [error_args, [e.reason]];
    throw e;
  }
}
function index_log(
  value: bigint,
  run: RunVersion,
): Record<string, bigint> {
  if (run === "v10a" && value !== 0n) {
    assert(value >= 10n ** 27n, `invalid index_ray: ${value}`);
    return {
      index_log: BigInt(Math.round(Math.log(Number(value) / 1e27) * 1e18)),
    };
  }
  return { index_log: value };
}
