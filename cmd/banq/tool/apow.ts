import { AbiCoder, ethers, id, isCallException } from "ethers";
import { pool_abi } from "../abi/abis.ts";

import type { Addressable } from "ethers";
import type { RunVersion } from "../../../arg/types.ts";
import { assert } from "../../../function/assert.ts";
import type { CommandResult } from "../../types.ts";

/**
 * @returns the encoded data for supplying to A pool
 */
export function supplyData(
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
/**
 * @returns a contract instance for given pool address
 */
export function poolOf(
  address: string | Addressable,
  signer: ethers.Signer,
  run: RunVersion,
) {
  return new ethers.Contract(address, pool_abi(run), signer);
}
/**
 * @returns the owner address of the APOW contract, or a CommandResult on revert
 */
export async function fetch_owner(
  apow: ethers.Contract,
  symbol: string,
): Promise<{ owner: string } | CommandResult> {
  try {
    const owner: string = await apow.owner();
    assert(owner, `invalid owner: ${owner}`);
    return { owner };
  } catch (e) {
    if (isCallException(e)) return [[symbol], [e.reason]];
    throw e;
  }
}
