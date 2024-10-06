import { ethers, isCallException, MaxUint256 } from "ethers";
import APOW_ABI from "./abi/apow-abi.json" with { type: "json" };
import MTY_ABI from "./abi/mty-abi.json" with { type: "json" };

import { arg_token_by } from "../../arg/arg-token-by.ts";
import { opt_gas } from "../../arg/opt-gas.ts";
import { opt_nft_ids } from "../../arg/opt-nft-id.ts";
import { opt_to } from "../../arg/opt-to.ts";

import { addressOf as x } from "../../function/address.ts";
import { assert } from "../../function/assert.ts";
import { wallet } from "../../wallet/index.ts";

import type { BanqArgs } from "../../cli/banq/banq.ts";
import type { CommandResult } from "../types.ts";

/**
 * apow-claim-batch [$XPOW] [--options]
 */
export async function command(args: BanqArgs): Promise<CommandResult> {
  if (args.list_options) {
    console.log([
      "APOW",
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
  const { address: token, symbol } = arg_token_by(args.rest, "APOW");
  assert(token > 0, `invalid token: ${token}`);
  const nft_ids = opt_nft_ids(args);
  assert(nft_ids, `invalid nft-id`);
  const { address: to } = opt_to(args);
  if (!args.broadcast) {
    return [[symbol, ...nft_ids, x(to)], [false]];
  }
  const { signer } = await wallet(args);
  const bito = to ? to : BigInt(await signer.getAddress());
  assert(bito > 0, `invalid address: ${x(bito)}`);
  const apow = new ethers.Contract(
    x(token),
    APOW_ABI,
    signer,
  );
  let owner: string | undefined;
  try {
    owner = await apow.owner();
    assert(owner, `invalid owner: ${owner}`);
  } catch (e) {
    if (isCallException(e)) {
      return [[symbol], [e.reason]];
    }
    throw e;
  }
  const mty = new ethers.Contract(
    owner,
    MTY_ABI,
    signer,
  );
  try {
    await mty.claimBatch(
      x(bito),
      nft_ids,
      MaxUint256,
      0, // nonce
      opt_gas(args),
    );
  } catch (e) {
    if (isCallException(e)) {
      return [[symbol], [e.reason]];
    }
    throw e;
  }
  return [[symbol], [true]];
}
