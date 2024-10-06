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
import { sleep } from "../../function/sleep.ts";
import { wallet } from "../../wallet/index.ts";
import type { CommandResult } from "../types.ts";

/**
 * reindex $TOKEN --mode={supply,borrow} [--options]
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
      "--watch",
      "-w",
    ].join(" "));
    Deno.exit(0);
  }
  const watch = opt_watch(args);
  if (watch) {
    return await execute_watch(args, watch);
  }
  return await execute(args, watch);
}
async function execute_watch(
  args: BanqArgs,
  watch = true,
): Promise<CommandResult> {
  const { address: token, symbol } = arg_token(args.rest);
  const { address: pool } = opt_pool(args);
  const { mode } = opt_mode(args);
  if (!args.broadcast) {
    return [[my(symbol, mode), watch], [false]];
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
      return [[my(symbol, mode), watch], [e.reason]];
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
      filter: ev.filter,
      index_ray,
      util_wad,
      stamp,
      symbol,
      token: x(token),
      log: ev.log,
    }));
  });
  while (watch) {
    await sleep(100); // non-blocking wait
  }
  return [[my(symbol, mode), watch], [true]];
}
async function execute(
  args: BanqArgs,
  watch = false,
): Promise<CommandResult> {
  const { address: token, symbol } = arg_token(args.rest);
  const { address: pool } = opt_pool(args);
  const { mode } = opt_mode(args);
  if (!args.broadcast) {
    return [[my(symbol, mode), watch], [false]];
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
      return [[my(symbol, mode), watch], [e.reason]];
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
  return [[my(symbol, mode), watch], [true]];
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
