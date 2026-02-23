import { ethers, isCallException } from "ethers";
import { oracle_abi } from "./abi/abis.ts";

import { arg_amount } from "../../arg/arg-amount.ts";
import { arg_token } from "../../arg/arg-token.ts";
import { opt_contract_run } from "../../arg/opt-contract-run.ts";
import { opt_gas } from "../../arg/opt-gas.ts";
import { opt_oracle } from "../../arg/opt-oracle.ts";
import { opt_percent_max, opt_percent_min } from "../../arg/opt-percent.ts";
import { opt_watch } from "../../arg/opt-watch.ts";
import type { RunVersion } from "../../arg/types.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../function/address.ts";
import { assert } from "../../function/assert.ts";
import { uuidv5 } from "../../function/uuidv5.ts";
import { wallet } from "../../wallet/index.ts";
import { BROADCAST, type CommandResult, DRY_RUN } from "../types.ts";

import { blockRange } from "./tool/block-range.ts";
import { blockSearch } from "./tool/block-search.ts";
import { list_options } from "./tool/completions.ts";
import { lhsQuote, relDelta, rhsQuote } from "./tool/rel-delta.ts";

/**
 * retwap $SOURCE_TOKEN $TARGET_TOKEN [--watch|--watch=<RANGE>] [--options]
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
    list_options(
      ["APOW", "XPOW"],
      [
        "--percent-min",
        "-L",
        "--percent-max",
        "-R",
        "--oracle",
        "-o",
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
  const { address: source, symbol: source_symbol } = arg_token(args, args.rest);
  const { address: target, symbol: target_symbol } = arg_token(args, args.rest);
  const { address: oracle } = opt_oracle(args);
  if (!args.broadcast) {
    return [
      [source_symbol, target_symbol, JSON.stringify([dlt, Infinity])],
      [DRY_RUN],
    ];
  }
  const { contract_run: run } = opt_contract_run(args);
  const { signer } = await wallet(args, true);
  ///
  /// retwap oracle --watch=DLT@Infinity
  ///
  const ORACLE = new ethers.Contract(x(oracle), oracle_abi(run), signer);
  const provider = signer.provider;
  assert(provider, "missing provider");
  const deploy_block = await blockSearch(provider, x(oracle));
  const block_number = await provider.getBlockNumber();
  for (
    let cursor = deploy_block;
    cursor <= block_number;
    cursor += dlt
  ) {
    const chunk_end = Math.min(cursor + dlt - 1, block_number);
    const event_logs = await ORACLE.queryFilter(
      "Refresh",
      cursor,
      chunk_end,
    );
    for (const ev_log of event_logs as ethers.EventLog[]) {
      const [source_address, target_address, quote] = ev_log.args ?? [
        x(0n),
        x(0n),
        0n,
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
        ...quote_mru(quote, run),
        log: ev_log,
      }));
    }
  }
  return [
    [source_symbol, target_symbol, JSON.stringify([dlt, Infinity])],
    [BROADCAST],
  ];
}
async function execute_watch_in(
  args: BanqArgs,
  range: [number, number?],
): Promise<CommandResult> {
  const { address: source, symbol: source_symbol } = arg_token(args, args.rest);
  const { address: target, symbol: target_symbol } = arg_token(args, args.rest);
  const { address: oracle } = opt_oracle(args);
  if (!args.broadcast) {
    return [[source_symbol, target_symbol, JSON.stringify(range)], [DRY_RUN]];
  }
  const { contract_run: run } = opt_contract_run(args);
  const { signer } = await wallet(args, true);
  ///
  /// retwap oracle --watch=DLT or --watch=DLT@IDX
  ///
  const ORACLE = new ethers.Contract(x(oracle), oracle_abi(run), signer);
  const provider = signer.provider;
  assert(provider, "missing provider");
  const block_number = await provider.getBlockNumber();
  const [lhs_block, rhs_block] = blockRange(block_number, range);
  const event_logs = await ORACLE.queryFilter(
    "Refresh",
    lhs_block,
    rhs_block,
  );
  for (const ev_log of event_logs as ethers.EventLog[]) {
    const [source_address, target_address, quote] = ev_log.args ?? [
      x(0n), // 0x0000000000000000000000000000000000000000 address
      x(0n), // 0x0000000000000000000000000000000000000000 address
      0n,
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
      ...quote_mru(quote, run),
      log: ev_log,
    }));
  }
  return [[source_symbol, target_symbol, JSON.stringify(range)], [BROADCAST]];
}
async function execute_watch(
  args: BanqArgs,
): Promise<CommandResult> {
  const { address: source, symbol: source_symbol } = arg_token(args, args.rest);
  const { address: target, symbol: target_symbol } = arg_token(args, args.rest);
  const { address: oracle } = opt_oracle(args);
  if (!args.broadcast) {
    return [[source_symbol, target_symbol, true], [DRY_RUN]];
  }
  const { contract_run: run } = opt_contract_run(args);
  const { signer } = await wallet(args, true);
  ///
  /// retwap oracle --watch
  ///
  const ORACLE = new ethers.Contract(x(oracle), oracle_abi(run), signer);
  const provider = signer.provider;
  assert(provider, "missing provider");
  return await new Promise((_, reject) => {
    provider.on("error", reject);
    ORACLE.on("Refresh", (
      source_address,
      target_address,
      quote,
      ev,
    ) => {
      try {
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
          ...quote_mru(quote, run),
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
  const { address: source, symbol: source_symbol } = arg_token(args, args.rest);
  const { address: target, symbol: target_symbol } = arg_token(args, args.rest);
  const { amount } = { amount: arg_amount(args.rest, 1e6) };
  const { percent_min } = { percent_min: opt_percent_min(args) };
  const { percent_max } = { percent_max: opt_percent_max(args) };
  const { address: oracle } = opt_oracle(args);
  if (!args.broadcast) {
    return [[source_symbol, target_symbol, false], [DRY_RUN]];
  }
  const { contract_run: run } = opt_contract_run(args);
  const { signer } = await wallet(args);
  ///
  /// retwap oracle feed
  ///
  const ORACLE = new ethers.Contract(x(oracle), oracle_abi(run), signer);
  const refreshed = await ORACLE.refreshed(x(source), x(target));
  if (!refreshed) {
    const [feed] = await ORACLE.getFeed(x(source), x(target));
    const FEED = new ethers.Contract(x(feed), FEED_ABI, signer);
    const lhs = await lhsQuote(ORACLE, { amount, source, target });
    const rhs = await rhsQuote(FEED, { amount });
    const rel_delta = relDelta(lhs, rhs);
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
      throw e;
    }
  }
  return [[source_symbol, target_symbol, false], [BROADCAST]];
}
function quote_mru(
  quote: { mid: bigint; rel: bigint; utc: bigint } | bigint,
  run: RunVersion,
): Record<string, bigint> {
  if (run === "v10a" && typeof quote !== "bigint") {
    return { quote_mid: quote.mid, quote_rel: quote.rel, quote_utc: quote.utc };
  }
  const word = quote as bigint;
  return {
    quote_mid: word >> 128n,
    quote_rel: (word >> 64n) & ((1n << 64n) - 1n),
    quote_utc: (word >> 16n) & ((1n << 48n) - 1n),
  };
}
const FEED_ABI = [
  "function getQuotes(uint256 amount) view returns (uint256 bid, uint256 ask)",
];
