import { ethers, isError, MaxUint256 } from "ethers";

import { arg_address } from "../../arg/arg-address.ts";
import { opt_pool } from "../../arg/opt-pool.ts";
import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../tool/address.ts";
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
  const { address: pool } = opt_pool(args);
  if (!args.broadcast) {
    return [[x(user)], [false]];
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
        const tx = await TOKEN.approve(x(pool), MaxUint256);
        await tx.wait(1);
      } catch (e) {
        if (isError(e, "CALL_EXCEPTION")) {
          return [[x(user)], [e.reason]];
        }
        throw e;
      }
    }
  }
  ///
  /// liquidate user position(s)
  ///
  try {
    await POOL.liquidate(x(user));
  } catch (e) {
    if (isError(e, "CALL_EXCEPTION")) {
      return [[x(user)], [e.reason]];
    }
    throw e;
  }
  return [[x(user)], [true]];
}
const TOKEN_ABI = [
  "function approve(address spender, uint256 amount)",
  "function allowance(address owner, address spender) view returns (uint256)",
];
const POOL_ABI = [
  "function liquidate(address user)",
  "function tokens() view returns (address[])",
];
