import TOKEN_ABI from "./abi/erc20-abi.json" with { type: "json" };
import POOL_ABI from "./abi/pool-abi.json" with { type: "json" };

import { ethers, parseUnits } from "ethers";

import { arg_amount } from "../../arg/arg-amount.ts";
import { arg_token } from "../../arg/arg-token.ts";
import { opt_pool } from "../../arg/opt-pool.ts";
import { opt_gas } from "../../arg/opt-gas.ts";
import { opt_timeout } from "../../arg/opt-timeout.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../function/address.ts";
import { wallet } from "../../wallet/index.ts";
import { BROADCAST, type CommandResult, DRY_RUN } from "../types.ts";

import { approve } from "./tool/approve.ts";
import { call } from "./tool/call.ts";
import { list_options } from "./tool/completions.ts";
import { pow_send } from "./tool/pow-tx.ts";

/**
 * supply $AMOUNT $TOKEN [--options]
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
    list_options(["APOW", "XPOW"], ["--pool", "-p", "--timeout", "-T"]);
  }
  const amount = arg_amount(args.rest);
  const { address: token, symbol } = arg_token(args, args.rest);
  const { address: pool } = opt_pool(args);
  if (!args.broadcast) {
    return [[amount, symbol], [DRY_RUN]];
  }
  const { signer, account } = await wallet(args);
  ///
  /// approve token allowance
  ///
  const TOKEN = new ethers.Contract(x(token), TOKEN_ABI, signer);
  const value = parseUnits(`${amount}`, await TOKEN.decimals());
  const reason = await approve(
    TOKEN,
    x(pool),
    value,
    account,
    opt_gas(args),
  );
  if (reason !== null) {
    return [[amount, symbol], [reason]];
  }
  ///
  /// supply token amount
  ///
  const POOL = new ethers.Contract(x(pool), POOL_ABI, signer);
  const difficulty: bigint = await POOL.supplyDifficultyOf(
    x(token),
    value,
  );
  if (difficulty > 0n) {
    const reason = await pow_send({
      pool: POOL,
      signer,
      selector: "supply(address,uint256)",
      token: x(token),
      value,
      difficulty,
      timeout: opt_timeout(args),
      gas: opt_gas(args),
    });
    return [[amount, symbol], [reason ?? BROADCAST]];
  }
  return await call(
    () => POOL["supply(address,uint256)"](x(token), value, opt_gas(args)),
    [amount, symbol],
  );
}
