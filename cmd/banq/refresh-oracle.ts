import { ethers } from "ethers";
import { oracle_abi } from "./abi/abis.ts";

import { arg_token } from "../../arg/arg-token.ts";
import { opt_contract_run } from "../../arg/opt-contract-run.ts";
import { opt_gas } from "../../arg/opt-gas.ts";
import { opt_oracle } from "../../arg/opt-oracle.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../function/address.ts";
import { wallet } from "../../wallet/index.ts";
import { type CommandResult, DRY_RUN } from "../types.ts";
import { call } from "./tool/call.ts";
import { list_options } from "./tool/completions.ts";

/**
 * refresh $SOURCE_TOKEN $TARGET_TOKEN [--options]
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
    list_options(["APOW", "XPOW"], ["--oracle", "-o"]);
  }
  const { address: source, symbol: src_symbol } = arg_token(args, args.rest);
  const { address: target, symbol: tgt_symbol } = arg_token(args, args.rest);
  const { address: oracle } = opt_oracle(args);
  if (!args.broadcast) {
    return [[src_symbol, tgt_symbol], [DRY_RUN]];
  }
  const { contract_run: run } = opt_contract_run(args);
  const { signer } = await wallet(args);
  ///
  /// refresh oracle feed
  ///
  const ORACLE = new ethers.Contract(x(oracle), oracle_abi(run), signer);
  return await call(
    () => ORACLE.refresh(x(source), x(target), opt_gas(args)),
    [src_symbol, tgt_symbol],
  );
}
