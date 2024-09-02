import { ethers, isError } from "ethers";

import { arg_token } from "../../arg/arg-token.ts";
import { opt_oracle } from "../../arg/opt-oracle.ts";
import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../tool/address.ts";
import { wallet } from "../../wallet/index.ts";
import type { CommandResult } from "../types.ts";

/**
 * retwap $SOURCE_TOKEN $TARGET_TOKEN [--options]
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
      "--oracle",
      "-o",
    ].join(" "));
    Deno.exit(0);
  }
  const { address: source, symbol: src_symbol } = arg_token(args.rest);
  const { address: target, symbol: tgt_symbol } = arg_token(args.rest);
  const { address: oracle } = opt_oracle(args);
  if (!args.broadcast) {
    return [[src_symbol, tgt_symbol], [false]];
  }
  const { signer } = await wallet(args);
  ///
  /// retwap oracle feed
  ///
  const ORACLE = new ethers.Contract(x(oracle), ORACLE_ABI, signer);
  try {
    await ORACLE.retwap(x(source), x(target));
  } catch (e) {
    if (isError(e, "CALL_EXCEPTION")) {
      return [[src_symbol, tgt_symbol], [e.reason]];
    }
  }
  return [[src_symbol, tgt_symbol], [true]];
}
const ORACLE_ABI = [
  "function retwap(address source, address target)",
];
