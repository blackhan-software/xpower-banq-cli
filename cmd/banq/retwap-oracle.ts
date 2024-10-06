import { ethers, isCallException } from "ethers";
import ORACLE_ABI from "./abi/oracle-abi.json" with { type: "json" };

import { arg_amount } from "../../arg/arg-amount.ts";
import { arg_token } from "../../arg/arg-token.ts";
import { opt_gas } from "../../arg/opt-gas.ts";
import { opt_oracle } from "../../arg/opt-oracle.ts";
import { opt_percent_max, opt_percent_min } from "../../arg/opt-percent.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../function/address.ts";
import { wallet } from "../../wallet/index.ts";
import type { CommandResult } from "../types.ts";

/**
 * retwap $SOURCE_TOKEN $TARGET_TOKEN [--options]
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
    ].join(" "));
    Deno.exit(0);
  }
  const { address: source, symbol: src_symbol } = arg_token(args.rest);
  const { address: target, symbol: tgt_symbol } = arg_token(args.rest);
  const { amount } = { amount: arg_amount(args.rest, 1e6) };
  const { percent_min } = { percent_min: opt_percent_min(args) };
  const { percent_max } = { percent_max: opt_percent_max(args) };
  const { address: oracle } = opt_oracle(args);
  if (!args.broadcast) {
    return [[src_symbol, tgt_symbol], [false]];
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
      return [[src_symbol, tgt_symbol], [
        `${(100 * rel_delta).toFixed(2)}%`,
      ]];
    }
    try {
      await ORACLE.retwap(x(source), x(target), opt_gas(args));
    } catch (e) {
      if (isCallException(e)) {
        return [[src_symbol, tgt_symbol], [e.reason]];
      }
    }
  }
  return [[src_symbol, tgt_symbol], [true]];
}
async function lhs_of(
  ORACLE: ethers.Contract,
  { amount, source, target }: {
    amount: number;
    source: bigint;
    target: bigint;
  },
): Promise<[bigint, bigint]> {
  try {
    return await ORACLE.getQuotes(amount, x(source), x(target));
  } catch (e) {
    if (isCallException(e)) {
      return [0n, 0n];
    }
    throw e;
  }
}
async function rhs_of(
  FEED: ethers.Contract,
  { amount }: { amount: number },
): Promise<[bigint, bigint]> {
  try {
    return await FEED.getQuotes(amount);
  } catch (_) {
    return [0n, 0n];
  }
}
function relative_delta(
  [lhs_bid, lhs_ask]: [bigint, bigint],
  [rhs_bid, rhs_ask]: [bigint, bigint],
): number {
  const dif_bid = Number(lhs_bid - rhs_bid);
  const sum_bid = Number(lhs_bid + rhs_bid);
  const dif_ask = Number(lhs_ask - rhs_ask);
  const sum_ask = Number(lhs_ask + rhs_ask);
  const rel_bid = sum_bid ? 2 * Math.abs(dif_bid) / sum_bid : 0;
  const rel_ask = sum_ask ? 2 * Math.abs(dif_ask) / sum_ask : 0;
  return (rel_bid + rel_ask) / 2;
}
const FEED_ABI = [
  "function getQuotes(uint256 amount) view returns (uint256 bid, uint256 ask)",
];
