import { ethers, isCallException } from "ethers";
import XPOW_ABI from "./abi/xpow-abi.json" with { type: "json" };

import { arg_token_by } from "../../arg/arg-token-by.ts";
import { opt_pow_level } from "../../arg/opt-pow-level.ts";
import { opt_to } from "../../arg/opt-to.ts";
import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../tool/address.ts";
import { wallet } from "../../wallet/index.ts";
import type { CommandResult } from "../types.ts";

/**
 * mine $LEVEL [$TOKEN] [--options]
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
    console.log([
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
    Deno.exit(0);
  }
  const { address: token, symbol } = arg_token_by(args.rest, "XPOW");
  const { pow_level } = opt_pow_level(args);
  const { address: to } = opt_to(args);
  if (!args.broadcast) {
    return [[symbol, x(to ?? 0n), pow_level], [false]];
  }
  const { signer } = await wallet(args);
  const x_to = to ? x(to) : await signer.getAddress();
  ///
  /// xpow-mine [$XPOW] --to=$TO --pow-level=$LEVEL
  ///
  const XPOW = new ethers.Contract(x(token), XPOW_ABI, signer);
  try {
    await XPOW.mint(x_to, "0x0".padEnd(66, "0"), "0x0");
  } catch (e) {
    if (isCallException(e)) {
      return [[symbol, x_to, pow_level], [e.reason]];
    }
    throw e;
  }
  return [[symbol, x_to, pow_level], [true]];
}
