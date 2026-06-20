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
import { fetch_owner } from "./tool/fetch-owner.ts";
import { poolOf } from "./tool/pool-of.ts";
import { supplyData } from "./tool/supply-data.ts";

/**
 * apow-claim [$APOW] [--options]
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
    list_options(["APOW"], ["--timeout", "-T"]);
  }
  const { address: token, symbol } = arg_token_by(args, args.rest, "APOW");
  assert(token > 0, `invalid token: ${token}`);
  const [nft_id] = opt_nft_ids(args);
  assert(nft_id, `invalid nft-id`);
  const { address: to } = opt_to(args);
  if (!args.broadcast) {
    return [[symbol, nft_id, x(to)], [DRY_RUN]];
  }
  const { contract_run: run } = opt_contract_run(args);
  const { signer } = await wallet(args);
  const tx_origin = BigInt(await signer.getAddress());
  assert(tx_origin > 0, `invalid tx-origin: ${x(tx_origin)}`);
  const to_address = to ? to : tx_origin;
  assert(to_address > 0, `invalid to-address: ${x(to_address)}`);
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
  const [pool, amount] = await Promise.all([
    mty.pool().then((address) => poolOf(address, signer, run)),
    mty.mintable(x(to_address), nft_id),
  ]);
  const nonce = await resolve_nonce(
    pool,
    apow.target,
    x(to_address),
    x(tx_origin),
    amount,
    args,
  );
  const gas_options = opt_gas(args);
  try {
    const tx = await mty.claim(
      x(to_address),
      nft_id,
      amount,
      nonce,
      {
        ...gas_options,
        gasLimit: gas_options.gasLimit ?? 1e6,
      },
    );
    await tx?.wait(1, opt_timeout(args));
  } catch (e) {
    if (isCallException(e)) {
      return [[symbol], [e.reason ?? e.shortMessage]];
    }
    throw e;
  }
  return [[symbol], [BROADCAST]];
}

async function resolve_nonce(
  pool: ethers.Contract,
  apow_target: string | import("ethers").Addressable,
  to_address: string,
  tx_origin: string,
  amount: bigint,
  args: BanqArgs,
): Promise<bigint> {
  if (!pool) {
    return 0n;
  }
  const [difficulty, blockHash] = await Promise.all([
    pool.supplyDifficultyOf(apow_target, amount),
    pool.blockHash(),
  ]);
  if (!difficulty || !blockHash) {
    return 0n;
  }
  const { contract_run: run } = opt_contract_run(args);
  const [_, nonce] = await pow(
    supplyData(to_address, apow_target, amount, run),
    difficulty,
    {
      blockHash: Promise.resolve(blockHash),
      address: Promise.resolve(tx_origin),
    },
    opt_timeout(args),
  );
  return nonce;
}
