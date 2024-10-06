import { ethers, isError } from "ethers";

import { arg_token } from "../../arg/arg-token.ts";
import { opt_at } from "../../arg/opt-at.ts";
import { opt_page } from "../../arg/opt-page.ts";
import { opt_pool } from "../../arg/opt-pool.ts";
import { opt_digits } from "../../arg/opt-digits.ts";
import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../tool/address.ts";
import { wallet } from "../../wallet/index.ts";
import type { CommandResult } from "../types.ts";
import Rates, { type RateInfo } from "./tool/rates.ts";
import { plot } from "./tool/rates-plot.ts";
import Utils from "./tool/utils.ts";

/**
 * rates-of $TOKEN [--options]
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
      "--digits",
      "-d",
      "--pool",
      "-p",
    ].join(" "));
    console.log([
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
    ].join(" "));
    console.log([
      "--plot=usbt",
      "--plot=log",
      "--plot",
    ].join(" "));
    Deno.exit(0);
  }
  const { address: token, symbol } = arg_token(args.rest);
  const { address: pool } = opt_pool(args);
  const digits = opt_digits(args);
  const at_index = opt_at(args);
  const page = opt_page(args);
  if (!args.broadcast) {
    return [[symbol], [false]];
  }
  const { signer } = await wallet(args, true);
  ///
  /// supply- and borrow-rate(s) of token
  ///
  const POOL = new ethers.Contract(x(pool), POOL_ABI, signer);
  try {
    const [position, vault] = await Promise.all([
      POOL.supplyOf(x(token)), // ~ borrowOf!
      POOL.vaultOf(x(token)),
    ]);
    const POSITION = new ethers.Contract(position, POSITION_ABI, signer);
    const VAULT = new ethers.Contract(vault, VAULT_ABI, signer);
    ///
    if (args.model) {
      const info = await POSITION.rate() as RateInfo;
      return [[symbol], [JSON.stringify(
        Rates.format(info, digits),
      )]];
    }
    const [info, utils] = await Promise.all([
      POSITION.rate() as Promise<RateInfo>,
      Utils.of(VAULT, at_index, page),
    ]);
    const rates = Array.from(Rates.of(utils, info, digits));
    if (args.plot) {
      setTimeout(() => { // delay to ensure stopped spinner!
        plot(rates, { subplot: args.plot!, symbol, digits });
      });
      return [[symbol], []];
    }
    return [[symbol], rates.map((usbt) => JSON.stringify(usbt))];
  } catch (e) {
    if (isError(e, "CALL_EXCEPTION")) {
      return [[symbol], [e.reason]];
    }
    throw e;
  }
}
const POOL_ABI = [
  "function borrowOf(address token) view returns (address borrow_position)",
  "function supplyOf(address token) view returns (address supply_position)",
  "function vaultOf(address token) view returns (address vault)",
];
const POSITION_ABI = [
  "function rate() view returns (tuple(uint256 rate, uint256 spread, uint256 util))",
];
const VAULT_ABI = [
  "function utilLength() view returns (uint256 length)",
  "function util() view returns (tuple(uint256 meanValue, uint256 timestamp))",
  "function utilAt(uint256 index) view returns (tuple(uint256 meanValue, uint256 timestamp))",
  "function utils() view returns (tuple(uint256 meanValue, uint256 timestamp)[])",
  "function utilsAt(uint256 page, uint256 page_size, uint256 page_step) view returns (tuple(uint256 meanValue, uint256 timestamp)[])",
];
