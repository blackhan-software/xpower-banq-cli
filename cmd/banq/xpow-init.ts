import { ethers } from "ethers";
import XPOW_ABI from "./abi/xpow-abi.json" with { type: "json" };

import { arg_token_by } from "../../arg/arg-token-by.ts";
import { opt_contract_run } from "../../arg/opt-contract-run.ts";
import { opt_gas } from "../../arg/opt-gas.ts";
import { opt_retry } from "../../arg/opt-retry.ts";
import { opt_timeout } from "../../arg/opt-timeout.ts";

import { addressOf as x } from "../../function/address.ts";
import { assert } from "../../function/assert.ts";
import { wallet } from "../../wallet/index.ts";
import { discover, resolve_arg_token } from "../../env/registry.ts";

import { call } from "./tool/call.ts";
import { list_options } from "./tool/completions.ts";
import { withRetry } from "./tool/with-retry.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import { type CommandResult, DRY_RUN } from "../types.ts";

/**
 * xpow-init [$XPOW] [--options]
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
    list_options(["XPOW"], ["--timeout", "-T"]);
  }
  const token_arg = arg_token_by(args, args.rest, "XPOW");
  if (!args.broadcast) {
    return [[token_arg.symbol], [DRY_RUN]];
  }
  const timeout = opt_timeout(args);
  const { retry, retry_gas_factor } = opt_retry(args);
  const { signer } = await wallet(args);
  const { contract_run: run } = opt_contract_run(args);
  const reg = await discover(signer.provider!, run);
  const { address: token, symbol } = resolve_arg_token(token_arg, reg);
  assert(token > 0, `invalid token: ${symbol}`);
  const xpow = new ethers.Contract(
    x(token),
    XPOW_ABI,
    signer,
  );
  return withRetry((attempt) => {
    const factor = Math.pow(retry_gas_factor, attempt);
    const gas_options = opt_gas(args, factor);
    return call(
      async () => {
        const tx = await xpow.init(gas_options);
        await tx.wait(1, timeout);
      },
      [symbol],
    );
  }, {
    maxRetry: retry,
    delayMs: 1_000,
  });
}
