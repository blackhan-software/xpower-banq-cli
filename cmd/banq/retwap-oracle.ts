import { ethers, isCallException } from "ethers";
import ORACLE_ABI from "./abi/oracle-abi.json" with { type: "json" };

import { arg_amount } from "../../arg/arg-amount.ts";
import { arg_token } from "../../arg/arg-token.ts";
import { opt_gas } from "../../arg/opt-gas.ts";
import { opt_oracle } from "../../arg/opt-oracle.ts";
import { opt_percent_max, opt_percent_min } from "../../arg/opt-percent.ts";
import { opt_watch } from "../../arg/opt-watch.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../function/address.ts";
import { assert } from "../../function/assert.ts";
import { uuidv5 } from "../../function/uuidv5.ts";
import { wallet } from "../../wallet/index.ts";
import type { CommandResult } from "../types.ts";

/**
 * retwap $SOURCE_TOKEN $TARGET_TOKEN [--watch|--watch=<RANGE>] [--options]
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
      "--percent-min",
      "-L",
      "--percent-max",
      "-R",
      "--oracle",
      "-o",
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
  const { address: source, symbol: source_symbol } = arg_token(args, args.rest);
  const { address: target, symbol: target_symbol } = arg_token(args, args.rest);
  const { address: oracle } = opt_oracle(args);
  if (!args.broadcast) {
    return [[source_symbol, target_symbol, JSON.stringify(range)], [false]];
  }
  const { signer } = await wallet(args, true);
  ///
  /// retwap oracle --watch=DLT or --watch=DLT@IDX
  ///
  const ORACLE = new ethers.Contract(x(oracle), ORACLE_ABI, signer);
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
  const event_logs = await ORACLE.queryFilter(
    "Refresh",
    lhs_block,
    rhs_block,
  );
  for (const ev_log of event_logs as ethers.EventLog[]) {
    const [source_address, target_address, quote] = ev_log.args ?? [
      x(0n), // 0x0000000000000000000000000000000000000000 address
      x(0n), // 0x0000000000000000000000000000000000000000 address
      { mid: 0n, rel: 0n, utc: 0n },
    ];
    if (BigInt(source_address) !== source) {
      continue;
    }
    if (BigInt(target_address) !== target) {
      continue;
    }
    console.log(JSON.stringify({
      id: uuidv5(JSON.stringify(ev_log)),
      filter: "Refresh",
      source_symbol,
      source_token: x(source_address),
      target_symbol,
      target_token: x(target_address),
      quote_mid: quote.mid,
      quote_rel: quote.rel,
      quote_utc: quote.utc,
      log: ev_log,
    }));
  }
  return [[source_symbol, target_symbol, JSON.stringify(range)], [true]];
}
async function execute_watch(
  args: BanqArgs,
): Promise<CommandResult> {
  const { address: source, symbol: source_symbol } = arg_token(args, args.rest);
  const { address: target, symbol: target_symbol } = arg_token(args, args.rest);
  const { address: oracle } = opt_oracle(args);
  if (!args.broadcast) {
    return [[source_symbol, target_symbol, true], [false]];
  }
  const { signer } = await wallet(args, true);
  ///
  /// retwap oracle --watch
  ///
  const ORACLE = new ethers.Contract(x(oracle), ORACLE_ABI, signer);
  await ORACLE.on("Refresh", (
    source_address,
    target_address,
    quote,
    ev,
  ) => {
    if (BigInt(source_address) !== source) {
      return;
    }
    if (BigInt(target_address) !== target) {
      return;
    }
    console.log(JSON.stringify({
      id: uuidv5(JSON.stringify(ev.log)),
      filter: ev.filter,
      source_symbol,
      source_token: x(source_address),
      target_symbol,
      target_token: x(target_address),
      quote_mid: quote.mid,
      quote_rel: quote.rel,
      quote_utc: quote.utc,
      log: ev.log,
    }));
  });
  return await new Promise(() => {}); // keep alive
}
async function execute(
  args: BanqArgs,
): Promise<CommandResult> {
  const { address: source, symbol: source_symbol } = arg_token(args, args.rest);
  const { address: target, symbol: target_symbol } = arg_token(args, args.rest);
  const { amount } = { amount: arg_amount(args.rest, 1e6) };
  const { percent_min } = { percent_min: opt_percent_min(args) };
  const { percent_max } = { percent_max: opt_percent_max(args) };
  const { address: oracle } = opt_oracle(args);
  if (!args.broadcast) {
    return [[source_symbol, target_symbol, false], [false]];
  }
  const { signer } = await wallet(args);
  ///
  /// retwap oracle feed
  ///
  const ORACLE = new ethers.Contract(x(oracle), ORACLE_ABI, signer);
  const refreshed = await ORACLE.refreshed(x(source), x(target));
  if (!refreshed) {
    const [feed] = await ORACLE.getFeed(x(source), x(target));
    const FEED = new ethers.Contract(x(feed), FEED_ABI, signer);
    const lhs = await lhs_of(ORACLE, { amount, source, target });
    const rhs = await rhs_of(FEED, { amount });
    const rel_delta = relative_delta(lhs, rhs);
    if (
      rel_delta > 0 && (
        // is rel. delta too small?
        rel_delta < percent_min ||
        // is rel. delta too large?
        rel_delta > percent_max
      )
    ) {
      return [[source_symbol, target_symbol], [
        `${(100 * rel_delta).toFixed(2)}%`,
      ]];
    }
    try {
      await ORACLE.retwap(x(source), x(target), opt_gas(args));
    } catch (e) {
      if (isCallException(e)) {
        return [[source_symbol, target_symbol], [e.reason]];
      }
    }
  }
  return [[source_symbol, target_symbol, false], [true]];
}
async function lhs_of(
  ORACLE: ethers.Contract,
  { amount, source, target }: {
    amount: number;
    source: bigint;
    target: bigint;
  },
): Promise<[bigint | null, bigint | null]> {
  try {
    return await ORACLE.getQuotes(amount, x(source), x(target));
  } catch (e) {
    if (isCallException(e)) {
      return [null, null];
    }
    throw e;
  }
}
async function rhs_of(
  FEED: ethers.Contract,
  { amount }: { amount: number },
): Promise<[bigint | null, bigint | null]> {
  try {
    return await FEED.getQuotes(amount);
  } catch (_) {
    return [null, null];
  }
}
function relative_delta(
  [rhs_bid, rhs_ask]: [bigint | null, bigint | null],
  [lhs_bid, lhs_ask]: [bigint | null, bigint | null],
  scale = 10n ** 18n, // fixed point scale
): number {
  if (rhs_bid === null || rhs_ask === null) {
    return Infinity;
  }
  if (lhs_bid === null || lhs_ask === null) {
    return Infinity;
  }
  // 2 * dif / sum in fixed point arithmetic
  const fpa = (lhs: bigint, rhs: bigint): number => {
    const dif = lhs > rhs ? lhs - rhs : rhs - lhs;
    const sum = lhs + rhs;
    if (sum === 0n) return 0;
    const fix = (2n * dif * scale) / sum;
    return Number(fix) / Number(scale);
  };
  return (fpa(lhs_bid, rhs_bid) + fpa(lhs_ask, rhs_ask)) / 2;
}
const FEED_ABI = [
  "function getQuotes(uint256 amount) view returns (uint256 bid, uint256 ask)",
];
