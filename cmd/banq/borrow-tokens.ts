import { ethers, parseUnits } from "ethers";
import TOKEN_ABI from "./abi/erc20-abi.json" with { type: "json" };
import { pool_abi } from "./abi/abis.ts";

import { arg_amount } from "../../arg/arg-amount.ts";
import { arg_token } from "../../arg/arg-token.ts";
import { opt_contract_run } from "../../arg/opt-contract-run.ts";
import { opt_pool } from "../../arg/opt-pool.ts";
import { opt_gas } from "../../arg/opt-gas.ts";
import { opt_timeout } from "../../arg/opt-timeout.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../function/address.ts";
import { wallet } from "../../wallet/index.ts";
import { BROADCAST, type CommandResult, DRY_RUN } from "../types.ts";
import { call } from "./tool/call.ts";
import { list_options } from "./tool/completions.ts";
import { pow_send } from "./tool/pow-tx.ts";

/**
 * borrow $AMOUNT $TOKEN [--options]
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
  const { contract_run: run } = opt_contract_run(args);
  const { signer } = await wallet(args);
  ///
  /// borrow token amount
  ///
  const TOKEN = new ethers.Contract(x(token), TOKEN_ABI, signer);
  const value = parseUnits(`${amount}`, await TOKEN.decimals());
  const POOL = new ethers.Contract(x(pool), pool_abi(run), signer);
  const difficulty: bigint = await POOL.borrowDifficultyOf(
    x(token),
    value,
  );
  if (difficulty > 0n) {
    const reason = await pow_send({
      pool: POOL,
      signer,
      selector: "borrow(address,uint256)",
      token: x(token),
      value,
      difficulty,
      timeout: opt_timeout(args),
      gas: opt_gas(args),
    });
    return [[amount, symbol], [reason ?? BROADCAST]];
  }
  return await call(
    () => POOL["borrow(address,uint256)"](x(token), value, opt_gas(args)),
    [amount, symbol],
  );
}
