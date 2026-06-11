import { ethers } from "ethers";
import XPOW_ABI from "./abi/xpow-abi.json" with { type: "json" };

import { arg_token_by } from "../../arg/arg-token-by.ts";
import { opt_gas } from "../../arg/opt-gas.ts";

import { addressOf as x } from "../../function/address.ts";
import { assert } from "../../function/assert.ts";
import { wallet } from "../../wallet/index.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import { type CommandResult, DRY_RUN } from "../types.ts";
import { call } from "./tool/call.ts";
import { list_options } from "./tool/completions.ts";

/**
 * xpow-init [$XPOW] [--options]
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
    list_options(["XPOW"]);
  }
  const { address: token, symbol } = arg_token_by(args, args.rest, "XPOW");
  assert(token > 0, `invalid token: ${token}`);
  if (!args.broadcast) {
    return [[symbol], [DRY_RUN]];
  }
  const { signer } = await wallet(args);
  const xpow = new ethers.Contract(
    x(token),
    XPOW_ABI,
    signer,
  );
  return await call(
    () => xpow.init(opt_gas(args)),
    [symbol],
  );
}
