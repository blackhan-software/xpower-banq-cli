import { type ethers, isCallException } from "ethers";
import { assert } from "../../../function/assert.ts";
import type { CommandResult } from "../../types.ts";

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
    if (isCallException(e)) {
      return [[symbol], [e.reason]];
    }
    throw e;
  }
}
export default fetch_owner;
