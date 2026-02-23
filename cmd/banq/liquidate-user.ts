import { ethers } from "ethers";
import POOL_ABI from "./abi/pool-abi.json" with { type: "json" };

import { arg_address } from "../../arg/arg-address.ts";
import { arg_number } from "../../arg/arg-number.ts";
import { opt_gas } from "../../arg/opt-gas.ts";
import { opt_pool } from "../../arg/opt-pool.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../function/address.ts";
import { wallet } from "../../wallet/index.ts";
import { type CommandResult, DRY_RUN } from "../types.ts";

import { call } from "./tool/call.ts";
import { list_options } from "./tool/completions.ts";

/**
 * liquidate $VICTIM_ADDRESS [--options]
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
    list_options([], ["--pool", "-p"]);
  }
  const user = arg_address(args.rest);
  const partial_exp = arg_number(args.rest, 0);
  const { address: pool } = opt_pool(args);
  if (!args.broadcast) {
    return [[x(user), partial_exp], [DRY_RUN]];
  }
  const { signer } = await wallet(args);
  ///
  /// liquidate user position(s)
  ///
  const POOL = new ethers.Contract(x(pool), POOL_ABI, signer);
  return await call(
    () => POOL.liquidate(x(user), partial_exp, opt_gas(args)),
    [x(user), partial_exp],
  );
}
