import { ethers, isCallException } from "ethers";
import ORACLE_ABI from "./abi/oracle-abi.json" with { type: "json" };

import { arg_token } from "../../arg/arg-token.ts";
import { opt_gas } from "../../arg/opt-gas.ts";
import { opt_oracle } from "../../arg/opt-oracle.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../function/address.ts";
import { wallet } from "../../wallet/index.ts";
import type { CommandResult } from "../types.ts";

/**
 * refresh $SOURCE_TOKEN $TARGET_TOKEN [--options]
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
  const { address: source, symbol: src_symbol } = arg_token(args, args.rest);
  const { address: target, symbol: tgt_symbol } = arg_token(args, args.rest);
  const { address: oracle } = opt_oracle(args);
  if (!args.broadcast) {
    return [[src_symbol, tgt_symbol], [false]];
  }
  const { signer } = await wallet(args);
  ///
  /// refresh oracle feed
  ///
  const ORACLE = new ethers.Contract(x(oracle), ORACLE_ABI, signer);
  try {
    await ORACLE.refresh(x(source), x(target), opt_gas(args));
  } catch (e) {
    if (isCallException(e)) {
      return [[src_symbol, tgt_symbol], [e.reason]];
    }
  }
  return [[src_symbol, tgt_symbol], [true]];
}
