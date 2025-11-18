import TOKEN_ABI from "./abi/erc20-abi.json" with { type: "json" };
import POOL_ABI from "./abi/pool-abi.json" with { type: "json" };
import { ethers, isCallException, MaxUint256 } from "ethers";

import { arg_address } from "../../arg/arg-address.ts";
import { arg_number } from "../../arg/arg-number.ts";
import { opt_pool } from "../../arg/opt-pool.ts";
import { opt_gas } from "../../arg/opt-gas.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../function/address.ts";
import { wallet } from "../../wallet/index.ts";
import type { CommandResult } from "../types.ts";

/**
 * liquidate $VICTIM_ADDRESS [--options]
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
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
      "--pool",
      "-p",
    ].join(" "));
    Deno.exit(0);
  }
  const user = arg_address(args.rest);
  const partial_exp = arg_number(args.rest, 0);
  const { address: pool } = opt_pool(args);
  if (!args.broadcast) {
    return [[x(user), partial_exp], [false]];
  }
  const { signer, account } = await wallet(args);
  ///
  /// approve token allowance
  ///
  const POOL = new ethers.Contract(x(pool), POOL_ABI, signer);
  for (const token of await POOL.tokens() as string[]) {
    const TOKEN = new ethers.Contract(token, TOKEN_ABI, signer);
    const allowance = await TOKEN.allowance(account, x(pool));
    if (MaxUint256 > allowance) {
      try {
        const tx = await TOKEN.approve(
          x(pool),
          MaxUint256,
          opt_gas(args),
        );
        await tx.wait(1);
      } catch (e) {
        if (isCallException(e)) {
          return [[x(user), partial_exp], [e.reason]];
        }
        throw e;
      }
    }
  }
  ///
  /// liquidate user position(s)
  ///
  try {
    await POOL.liquidate(x(user), partial_exp, opt_gas(args));
  } catch (e) {
    if (isCallException(e)) {
      return [[x(user), partial_exp], [e.reason]];
    }
    throw e;
  }
  return [[x(user)], [true]];
}
