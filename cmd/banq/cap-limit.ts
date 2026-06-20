import { caps_abi, pool_abi } from "./abi/abis.ts";
import { ethers } from "ethers";

import { arg_token } from "../../arg/arg-token.ts";
import { opt_caps } from "../../arg/opt-caps.ts";
import { opt_contract_run } from "../../arg/opt-contract-run.ts";
import { opt_decrease } from "../../arg/opt-decrease.ts";
import { opt_gas } from "../../arg/opt-gas.ts";
import { opt_increase } from "../../arg/opt-increase.ts";
import { opt_mode } from "../../arg/opt-mode.ts";
import { opt_pool } from "../../arg/opt-pool.ts";
import { opt_retry } from "../../arg/opt-retry.ts";

import type { Mode } from "../../arg/types.ts";
import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../function/address.ts";
import { bimin } from "../../function/bimin.ts";
import { wallet } from "../../wallet/index.ts";
import { type CommandResult, DRY_RUN } from "../types.ts";

import { call } from "./tool/call.ts";
import { withRetry } from "./tool/with-retry.ts";
import { list_options } from "./tool/completions.ts";

const U112_MAX = 2n ** 112n - 1n; // type(uint112).max

/**
 * cap-limit --mode=supply|borrow $TOKEN $VALUE [--inc|--dec] [--options]
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
    list_options(["APOW", "XPOW"], [
      "--increase",
      "--inc",
      "--decrease",
      "--dec",
      "--mode",
      "-M",
      "--pool",
      "-p",
    ]);
  }
  const { op } = opt_op(args);
  const { mode } = opt_mode(args);
  const { address: token, symbol } = arg_token(args, args.rest);
  const value_raw = args.rest.shift();
  const value_bin = value_raw !== undefined ? BigInt(value_raw) : 0n;
  const value = bimin(value_bin, U112_MAX);
  if (!args.broadcast) {
    return [[symbol, mode, op, value], [DRY_RUN]];
  }
  const { retry, retry_gas_factor } = opt_retry(args);
  const { contract_run: run } = opt_contract_run(args);
  const { address: pool } = opt_pool(args);
  const { signer } = await wallet(args);
  //
  // relative: dispatch to Caps (incl. pool address)
  //
  if (op === "inc" || op === "dec") {
    const { address: caps } = opt_caps();
    const CAPS = new ethers.Contract(x(caps), caps_abi(run), signer);
    return withRetry((attempt) => {
      const factor = Math.pow(retry_gas_factor, attempt);
      const gas_options = opt_gas(args, factor);
      return call(
        () => CAPS[method(mode, op)](x(pool), x(token), value, gas_options),
        [symbol, mode, op, value],
      );
    }, { maxRetry: retry, delayMs: 1_000 });
  }
  //
  // absolute: dispatch to Pool (directly)
  //
  const POOL = new ethers.Contract(x(pool), pool_abi(run), signer);
  return withRetry((attempt) => {
    const factor = Math.pow(retry_gas_factor, attempt);
    const gas_options = opt_gas(args, factor);
    return call(
      () => POOL[method(mode, op)](x(token), value, gas_options),
      [symbol, mode, op, value],
    );
  }, { maxRetry: retry, delayMs: 1_000 });
}
function method(mode: Mode, op: Op) {
  const key = mode === "supply" ? "Supply" : "Borrow";
  if (op === "dec" || op === "inc") {
    return `${op}${key}(address,address,uint112)`;
  }
  return `cap${key}(address,uint256)`;
}
function opt_op(args: BanqArgs): { op: Op } {
  const { increase } = opt_increase(args);
  const { decrease } = opt_decrease(args);
  if (increase && decrease) {
    throw new Error("exclusive --inc and --dec");
  }
  return { op: increase ? "inc" : decrease ? "dec" : "cap" };
}
type Op = "cap" | "inc" | "dec";
