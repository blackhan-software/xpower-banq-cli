import { ethers } from "ethers";
import XPOW_ABI from "./abi/xpow-abi.json" with { type: "json" };

import { arg_token_by } from "../../arg/arg-token-by.ts";
import { opt_gas } from "../../arg/opt-gas.ts";
import { opt_retry } from "../../arg/opt-retry.ts";
import { opt_timeout } from "../../arg/opt-timeout.ts";

import { addressOf as x } from "../../function/address.ts";
import { assert } from "../../function/assert.ts";
import { wallet } from "../../wallet/index.ts";

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
  const { address: token, symbol } = arg_token_by(args, args.rest, "XPOW");
  assert(token > 0, `invalid token: ${token}`);
  if (!args.broadcast) {
    return [[symbol], [DRY_RUN]];
  }
  const timeout = opt_timeout(args);
  const { retry, retry_gas_factor } = opt_retry(args);
  const { signer } = await wallet(args);
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
