import { ethers, isError, MaxUint256, parseUnits } from "ethers";

import { arg_amount } from "../../arg/arg-amount.ts";
import { arg_token } from "../../arg/arg-token.ts";
import { opt_pool } from "../../arg/opt-pool.ts";
import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../tool/address.ts";
import { wallet } from "../../wallet/index.ts";
import type { CommandResult } from "../types.ts";

/**
 * settle $AMOUNT $TOKEN [--options]
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
      "--pool",
      "-p",
    ].join(" "));
    Deno.exit(0);
  }
  const amount = arg_amount(args.rest);
  const { address: token, symbol } = arg_token(args.rest);
  const { address: pool } = opt_pool(args);
  if (!args.broadcast) {
    return [[amount, symbol], [false]];
  }
  const { signer, account } = await wallet(args);
  ///
  /// approve token allowance
  ///
  const TOKEN = new ethers.Contract(x(token), TOKEN_ABI, signer);
  const value = parseUnits(`${amount}`, await TOKEN.decimals());
  const allowance = await TOKEN.allowance(account, x(pool));
  if (MaxUint256 > allowance) {
    try {
      const tx = await TOKEN.approve(x(pool), MaxUint256);
      await tx.wait(1);
    } catch (e) {
      if (isError(e, "CALL_EXCEPTION")) {
        return [[amount, symbol], [e.reason]];
      }
      throw e;
    }
  }
  ///
  /// settle token amount
  ///
  const POOL = new ethers.Contract(x(pool), POOL_ABI, signer);
  try {
    await POOL.settle(x(token), value);
  } catch (e) {
    if (isError(e, "CALL_EXCEPTION")) {
      return [[amount, symbol], [e.reason]];
    }
    throw e;
  }
  return [[amount, symbol], [true]];
}
const TOKEN_ABI = [
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount)",
  "function allowance(address owner, address spender) view returns (uint256)",
];
const POOL_ABI = [
  "function settle(address token, uint256 amount)",
];