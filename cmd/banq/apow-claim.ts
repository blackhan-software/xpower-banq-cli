import { AbiCoder, ethers, id, isCallException } from "ethers";
import APOW_ABI from "./abi/apow-abi.json" with { type: "json" };
import POOL_ABI from "./abi/pool-abi.json" with { type: "json" };
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

import type { Addressable } from "ethers";
import { pow } from "../../pow/index.ts";

import "../../function/json.ts";

/**
 * apow-claim [$APOW] [--options]
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
  const { address: token, symbol } = arg_token_by(args, args.rest, "APOW");
  assert(token > 0, `invalid token: ${token}`);
  const [nft_id] = opt_nft_ids(args);
  assert(nft_id, `invalid nft-id`);
  const { address: to } = opt_to(args);
  if (!args.broadcast) {
    return [[symbol, nft_id, x(to)], [false]];
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
  const [pool, amount] = await Promise.all([
    mty.pool().then((address) => poolOf(address, signer)),
    mty.mintable(x(bito), nft_id),
  ]);
  // Check if proof-of-work nonce is required:
  let nonce: number | string = 0;
  {
    const [difficulty, blockHash] = await Promise.all([
      pool?.supplyDifficultyOf(apow.target, amount),
      pool?.blockHash(),
    ]);
    if (difficulty && blockHash) {
      const data = supplyData(
        x(bito),
        apow.target,
        amount,
      );
      nonce = await pow(data, difficulty, {
        address: Promise.resolve(x(bito)),
        blockHash,
      });
    }
  }
  try {
    await mty.claim(
      x(bito),
      nft_id,
      amount,
      nonce,
      opt_gas(args),
    );
  } catch (e) {
    if (isCallException(e) && e.data) {
      const ed = mty.interface.parseError(e.data);
      if (ed) {
        console.error(ed);
      } else {
        console.error(e);
      }
      return [[symbol], [e.reason]];
    }
    if (isCallException(e)) {
      return [[symbol], [e.reason]];
    }
    throw e;
  }
  return [[symbol], [true]];
}
function supplyData(
  account: string,
  token: string | Addressable,
  amount: bigint,
): string {
  const selector = id("supply(address,address,uint256,bool)");
  const args = AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "uint256", "bool", "uint256"],
    [account, token, amount, true, 0n],
  );
  return selector.slice(0, 10) + args.slice(2);
}
function poolOf(
  address: string | Addressable,
  signer: ethers.Signer,
) {
  return new ethers.Contract(
    address,
    POOL_ABI,
    signer,
  );
}
