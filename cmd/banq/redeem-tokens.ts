import { ethers, parseUnits } from "ethers";
import TOKEN_ABI from "./abi/erc20-abi.json" with { type: "json" };
import POOL_ABI from "./abi/pool-abi.json" with { type: "json" };

import { arg_amount } from "../../arg/arg-amount.ts";
import { arg_token } from "../../arg/arg-token.ts";
import { opt_pool } from "../../arg/opt-pool.ts";
import { opt_gas } from "../../arg/opt-gas.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../function/address.ts";
import { wallet } from "../../wallet/index.ts";
import { type CommandResult, DRY_RUN } from "../types.ts";
import { call } from "./tool/call.ts";
import { list_options } from "./tool/completions.ts";

/**
 * redeem $AMOUNT $TOKEN [--options]
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
    list_options(["APOW", "XPOW"], ["--pool", "-p"]);
  }
  const amount = arg_amount(args.rest);
  const { address: token, symbol } = arg_token(args, args.rest);
  const { address: pool } = opt_pool(args);
  if (!args.broadcast) {
    return [[amount, symbol], [DRY_RUN]];
  }
  const { signer } = await wallet(args);
  ///
  /// redeem token amount
  ///
  const TOKEN = new ethers.Contract(x(token), TOKEN_ABI, signer);
  const value = parseUnits(`${amount}`, await TOKEN.decimals());
  const POOL = new ethers.Contract(x(pool), POOL_ABI, signer);
  return await call(
    () => POOL.redeem(x(token), value, opt_gas(args)),
    [amount, symbol],
  );
}
