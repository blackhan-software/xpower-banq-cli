import { ethers, isCallException } from "ethers";

import { pool_abi, position_abi } from "./abi/abis.ts";

import { arg_token } from "../../arg/arg-token.ts";
import { opt_at } from "../../arg/opt-at.ts";
import { opt_contract_run } from "../../arg/opt-contract-run.ts";
import { opt_digits } from "../../arg/opt-digits.ts";
import { opt_page } from "../../arg/opt-page.ts";
import { opt_pool } from "../../arg/opt-pool.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../function/address.ts";
import { wallet } from "../../wallet/index.ts";
import { discover, resolve_arg_token } from "../../env/registry.ts";
import { type CommandResult, DRY_RUN } from "../types.ts";

import { list_options } from "./tool/completions.ts";
import { plot } from "./tool/rates-plot.ts";
import Rates, { type RateInfo } from "./tool/rates.ts";
import Token from "./tool/token.ts";
import Utils from "./tool/utils.ts";

/**
 * rates-of $TOKEN [--options]
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
    list_options(
      ["APOW", "XPOW"],
      ["--digits", "-d", "--pool", "-p"],
      [
        "--at=now",
        "--at=all",
        "--at",
        "-@",
        "--model",
        "-m",
        "--page=0",
        "--page",
        "-#",
        "--page-size=10",
        "--page-size",
        "-z",
        "--page-step=1",
        "--page-step",
        "-s",
      ],
      ["--plot=usbt", "--plot=log", "--plot"],
    );
  }
  const token_arg = arg_token(args, args.rest);
  const { address: pool } = opt_pool(args);
  const digits = opt_digits(args);
  const at_index = opt_at(args);
  const page = opt_page(args);
  if (!args.broadcast) {
    return [[token_arg.symbol], [DRY_RUN]];
  }
  const { contract_run: run } = opt_contract_run(args);
  const { signer } = await wallet(args, true);
  const reg = await discover(signer.provider!, run);
  const { address: token, symbol } = resolve_arg_token(token_arg, reg);
  ///
  /// supply- and borrow-rate(s) of token
  ///
  const POOL = new ethers.Contract(x(pool), pool_abi(run), signer);
  const POSITION_ABI = position_abi(run);
  try {
    const [sp, bp] = await Promise.all([
      POOL.supplyOf(x(token)), // sp-address
      POOL.borrowOf(x(token)), // bp-address
    ]);
    const S_POS = new ethers.Contract(sp, POSITION_ABI, signer);
    const B_POS = new ethers.Contract(bp, POSITION_ABI, signer);
    ///
    if (args.model) {
      const info = await fetch_model(S_POS);
      return [[symbol], [JSON.stringify(
        Rates.format(info, digits),
      )]];
    }
    const [info, utils, sp_info, bp_info] = await Promise.all([
      fetch_model(S_POS),
      Utils.of(S_POS, B_POS, at_index, page),
      Token.of(S_POS),
      Token.of(B_POS),
    ]);
    const rates = Array.from(Rates.of(utils, info, digits));
    if (args.plot) {
      setTimeout(() => { // delay to ensure stopped spinner!
        plot(rates, sp_info, bp_info, {
          subplot: args.plot!,
          symbol,
          digits,
        });
      });
      return [[symbol], []];
    }
    return [[symbol], rates.map((usbt) => JSON.stringify(usbt))];
  } catch (e) {
    if (isCallException(e)) {
      return [[symbol], [e.reason]];
    }
    throw e;
  }
}
async function fetch_model(pos: ethers.Contract): Promise<RateInfo> {
  const model = await pos.model() as RateInfo;
  return {
    base: model.base ?? 0n,
    rate: model.rate,
    spread: model.spread,
    util: model.util,
  };
}
