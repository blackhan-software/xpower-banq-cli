import { type AddressLike, ethers, isAddress, isCallException } from "ethers";
import POOL_ABI from "./abi/pool-abi.json" with { type: "json" };
import POSITION_ABI from "./abi/position-abi.json" with { type: "json" };

import { arg_token } from "../../arg/arg-token.ts";
import { opt_gas } from "../../arg/opt-gas.ts";
import { opt_mode } from "../../arg/opt-mode.ts";
import { opt_pool } from "../../arg/opt-pool.ts";
import { opt_watch } from "../../arg/opt-watch.ts";
import type { Mode } from "../../arg/types.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../function/address.ts";
import { assert } from "../../function/assert.ts";
import { uuidv5 } from "../../function/uuidv5.ts";
import { wallet } from "../../wallet/index.ts";
import type { CommandResult } from "../types.ts";

/**
 * reindex $TOKEN --mode={supply,borrow} [--watch|--watch=<RANGE>] [--options]
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
    console.log([
      "APOW",
      "XPOW",
    ].join(" "));
    console.log([
      "--help",
      "-h",
      "--version",
      "-v",
    ].join(" "));
    console.log([
      "--broadcast",
      "-Y",
      "--hd-path",
      "-H",
      "--json",
      "-j",
      "--ledger",
      "-l",
      "--no-progress",
      "-P",
      "--private-key",
      "-k",
      "--provider-url",
      "-u",
    ].join(" "));
    console.log([
      "--mode=supply",
      "--mode=borrow",
      "-M",
      "--pool",
      "-p",
      "--watch=",
      "--watch",
      "-w",
    ].join(" "));
    Deno.exit(0);
  }
  const [watch, range] = opt_watch(args);
  if (watch && range) {
    return await execute_watch_in(args, range);
  }
  if (watch) {
    return await execute_watch(args);
  } else {
    return await execute(args);
  }
}
async function execute_watch_in(
  args: BanqArgs,
  range: [number, number?],
): Promise<CommandResult> {
  const { address: token, symbol } = arg_token(args, args.rest);
  const { address: pool } = opt_pool(args);
  const { mode } = opt_mode(args);
  if (!args.broadcast) {
    return [[my(symbol, mode), JSON.stringify(range)], [false]];
  }
  const { signer } = await wallet(args, true);
  ///
  /// reindex token --watch=DLT or --watch=DLT@IDX
  ///
  const POOL = new ethers.Contract(x(pool), POOL_ABI, signer);
  let position: AddressLike;
  try {
    position = await positionOf(POOL, token, mode);
    assert(isAddress(position), "invalid address");
  } catch (e) {
    if (isCallException(e)) {
      return [[my(symbol, mode), JSON.stringify(range)], [e.reason]];
    }
    throw e;
  }
  const POSITION = new ethers.Contract(
    position,
    POSITION_ABI,
    signer,
  );
  const provider = signer.provider;
  assert(provider, "missing provider");
  const block_number = await provider.getBlockNumber();
  const [lhs_block, rhs_block] = (typeof range[1] !== "number")
    // --watch=DLT     => scan in [BLK-DLT*(1.000),BLK-DLT*(0.0)]
    ? [block_number - range[0], block_number]
    // --watch=DLT:IDX => scan in [BLK-DLT*(1+IDX),BLK-DLT*(IDX)]
    : [
      block_number - range[0] * (range[1] + 1),
      block_number - range[0] * (range[1]),
    ];
  const event_logs = await POSITION.queryFilter(
    "Reindex",
    lhs_block,
    rhs_block,
  );
  for (const ev_log of event_logs as ethers.EventLog[]) {
    const [index_ray, util_wad, stamp] = ev_log.args ?? [0n, 0n, 0n];
    console.log(JSON.stringify({
      id: uuidv5(JSON.stringify(ev_log)),
      filter: "Reindex",
      index_ray,
      util_wad,
      stamp,
      symbol,
      token: x(token),
      mode,
      log: ev_log,
    }));
  }
  return [[my(symbol, mode), JSON.stringify(range)], [true]];
}
async function execute_watch(
  args: BanqArgs,
): Promise<CommandResult> {
  const { address: token, symbol } = arg_token(args, args.rest);
  const { address: pool } = opt_pool(args);
  const { mode } = opt_mode(args);
  if (!args.broadcast) {
    return [[my(symbol, mode), true], [false]];
  }
  const { signer } = await wallet(args, true);
  ///
  /// reindex token --watch
  ///
  const POOL = new ethers.Contract(x(pool), POOL_ABI, signer);
  let position: AddressLike;
  try {
    position = await positionOf(POOL, token, mode);
    assert(isAddress(position), "invalid address");
  } catch (e) {
    if (isCallException(e)) {
      return [[my(symbol, mode), true], [e.reason]];
    }
    throw e;
  }
  const POSITION = new ethers.Contract(
    position,
    POSITION_ABI,
    signer,
  );
  await POSITION.on("Reindex", (
    index_ray,
    util_wad,
    stamp,
    ev,
  ) => {
    console.log(JSON.stringify({
      id: uuidv5(JSON.stringify(ev.log)),
      filter: ev.filter,
      index_ray,
      util_wad,
      stamp,
      symbol,
      token: x(token),
      mode,
      log: ev.log,
    }));
  });
  return await new Promise(() => {}); // keep alive
}
async function execute(
  args: BanqArgs,
): Promise<CommandResult> {
  const { address: token, symbol } = arg_token(args, args.rest);
  const { address: pool } = opt_pool(args);
  const { mode } = opt_mode(args);
  if (!args.broadcast) {
    return [[my(symbol, mode), false], [false]];
  }
  const { signer } = await wallet(args);
  ///
  /// reindex token
  ///
  const POOL = new ethers.Contract(x(pool), POOL_ABI, signer);
  let position: AddressLike;
  try {
    position = await positionOf(POOL, token, mode);
    assert(isAddress(position), "invalid address");
  } catch (e) {
    if (isCallException(e)) {
      return [[my(symbol, mode), false], [e.reason]];
    }
    throw e;
  }
  const POSITION = new ethers.Contract(
    position,
    POSITION_ABI,
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
  return [[my(symbol, mode), false], [true]];
}
function positionOf(
  pool: ethers.Contract,
  token: bigint,
  mode: Mode,
): AddressLike {
  switch (mode) {
    case "supply":
      return pool.supplyOf(x(token));
    case "borrow":
      return pool.borrowOf(x(token));
  }
}
function my(
  symbol: string,
  mode: Mode,
): string {
  switch (mode) {
    case "supply":
      return `s${symbol}`;
    case "borrow":
      return `b${symbol}`;
  }
}
