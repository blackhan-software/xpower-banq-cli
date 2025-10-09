import { AbiCoder, ethers, id, isCallException, parseUnits } from "ethers";
import TOKEN_ABI from "./abi/erc20-abi.json" with { type: "json" };
import POOL_ABI from "./abi/pool-abi.json" with { type: "json" };

import { arg_amount } from "../../arg/arg-amount.ts";
import { arg_token } from "../../arg/arg-token.ts";
import { opt_pool } from "../../arg/opt-pool.ts";
import { opt_gas } from "../../arg/opt-gas.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../function/address.ts";
import { pow } from "../../pow/index.ts";
import { wallet } from "../../wallet/index.ts";
import type { CommandResult } from "../types.ts";

/**
 * borrow $AMOUNT $TOKEN [--options]
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
  const { signer } = await wallet(args);
  ///
  /// borrow token amount
  ///
  const TOKEN = new ethers.Contract(x(token), TOKEN_ABI, signer);
  const value = parseUnits(`${amount}`, await TOKEN.decimals());
  const POOL = new ethers.Contract(x(pool), POOL_ABI, signer);
  const difficulty: bigint = await POOL.borrowDifficultyOf(
    x(token),
    value,
  );
  if (difficulty > 0n) {
    const selector = id("borrow(address,uint256)").slice(0, 10);
    const params = AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "uint256"],
      [x(token), value, 0n], // nonce
    );
    const data = selector + params.slice(2);
    try {
      await signer.sendTransaction({
        data: await pow(data, difficulty, {
          address: signer.getAddress(),
          blockHash: POOL.blockHash(),
        }),
        to: x(pool),
        ...opt_gas(args),
      });
    } catch (e) {
      if (isCallException(e)) {
        return [[amount, symbol], [e.reason]];
      }
      throw e;
    }
    return [[amount, symbol], [true]];
  }
  try {
    await POOL.borrow(x(token), value, opt_gas(args));
  } catch (e) {
    if (isCallException(e)) {
      return [[amount, symbol], [e.reason]];
    }
    throw e;
  }
  return [[amount, symbol], [true]];
}
