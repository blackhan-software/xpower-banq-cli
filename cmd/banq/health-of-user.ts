import { Decimal } from "decimal.js";
import { ethers, isError } from "ethers";

import { arg_address } from "../../arg/arg-address.ts";
import { opt_pool } from "../../arg/opt-pool.ts";
import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../tool/address.ts";
import { wallet } from "../../wallet/index.ts";
import type { CommandResult } from "../types.ts";
import { opt_digits } from "../../arg/opt-digits.ts";

/**
 * health-of $USER_ADDRESS [--options]
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
      "--digits",
      "-d",
      "--pool",
      "-p",
    ].join(" "));
    Deno.exit(0);
  }
  const user = arg_address(args.rest);
  const { address: pool } = opt_pool(args);
  const digits = opt_digits(args);
  if (!args.broadcast) {
    return [[x(user)], [false]];
  }
  const { signer } = await wallet(args);
  ///
  /// health-of user position(s)
  ///
  const POOL = new ethers.Contract(x(pool), POOL_ABI, signer);
  try {
    const health = await POOL.healthOf(x(user));
    const borrow = new Decimal(health.wnav_borrow.toString());
    const supply = new Decimal(health.wnav_supply.toString());
    const ratio = supply.div(borrow); // supply / borrow
    return [[x(user)], [ratio.toExponential(digits)]];
  } catch (e) {
    if (isError(e, "CALL_EXCEPTION")) {
      return [[x(user)], [e.reason]];
    }
    throw e;
  }
}
const POOL_ABI = [
  "function healthOf(address user) view returns (tuple(uint256 wnav_borrow, uint256 wnav_supply))",
];
