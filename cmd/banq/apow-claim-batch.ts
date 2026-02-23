import { ethers, isCallException } from "ethers";
import APOW_ABI from "./abi/apow-abi.json" with { type: "json" };
import MTY_ABI from "./abi/mty-abi.json" with { type: "json" };

import { arg_token_by } from "../../arg/arg-token-by.ts";
import { opt_contract_run } from "../../arg/opt-contract-run.ts";
import { opt_gas } from "../../arg/opt-gas.ts";
import { opt_nft_ids } from "../../arg/opt-nft-id.ts";
import { opt_timeout } from "../../arg/opt-timeout.ts";
import { opt_to } from "../../arg/opt-to.ts";

import { addressOf as x } from "../../function/address.ts";
import { assert } from "../../function/assert.ts";
import { wallet } from "../../wallet/index.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import { BROADCAST, type CommandResult, DRY_RUN } from "../types.ts";
import { list_options } from "./tool/completions.ts";

import { pow } from "../../pow/index.ts";
import { fetch_owner, poolOf, supplyData } from "./tool/apow.ts";

/**
 * apow-claim-batch [$APOW] [--options]
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
    list_options(["APOW"], ["--timeout", "-T"]);
  }
  const { address: token, symbol } = arg_token_by(args, args.rest, "APOW");
  assert(token > 0, `invalid token: ${token}`);
  const nft_ids = opt_nft_ids(args);
  assert(nft_ids, `invalid nft-id`);
  const { address: to } = opt_to(args);
  if (!args.broadcast) {
    return [[symbol, ...nft_ids, x(to)], [DRY_RUN]];
  }
  const { contract_run: run } = opt_contract_run(args);
  const { signer } = await wallet(args);
  const bito = to ? to : BigInt(await signer.getAddress());
  assert(bito > 0, `invalid address: ${x(bito)}`);
  const apow = new ethers.Contract(
    x(token),
    APOW_ABI,
    signer,
  );
  const owner_result = await fetch_owner(apow, symbol);
  if (Array.isArray(owner_result)) return owner_result;
  const { owner } = owner_result;
  const mty = new ethers.Contract(
    owner,
    MTY_ABI,
    signer,
  );
  const [pool, amounts] = await Promise.all([
    mty.pool().then((address) => poolOf(address, signer, run)),
    mty.mintableBatch(x(bito), nft_ids) as Promise<bigint[]>,
  ]);
  const amount = Array.from(amounts).reduce(
    (sum, a) => sum + a,
    0n,
  );
  const nonce = await resolve_nonce(pool, apow.target, x(bito), amount, args);
  try {
    await mty.claimBatch(
      x(bito),
      nft_ids,
      amount,
      nonce,
      opt_gas(args),
    );
  } catch (e) {
    if (isCallException(e)) {
      return [[symbol], [e.reason]];
    }
    throw e;
  }
  return [[symbol], [BROADCAST]];
}

async function resolve_nonce(
  // deno-lint-ignore no-explicit-any
  pool: any,
  apow_target: string | import("ethers").Addressable,
  bito_hex: string,
  amount: bigint,
  args: BanqArgs,
): Promise<number | string> {
  if (!pool) return 0;
  const [difficulty, blockHash] = await Promise.all([
    pool.supplyDifficultyOf(apow_target, amount),
    pool.blockHash(),
  ]);
  if (!difficulty || !blockHash) return 0;
  return pow(supplyData(bito_hex, apow_target, amount), difficulty, {
    address: Promise.resolve(bito_hex),
    blockHash: Promise.resolve(blockHash),
  }, opt_timeout(args));
}
