import { type ethers, isCallException, MaxUint256 } from "ethers";
import type { GasOptions } from "../../../arg/opt-gas.ts";

/**
 * Approve token allowance if current allowance is insufficient.
 *
 * @returns null on success, or the revert reason string on failure
 */
export async function approve(
  token: ethers.Contract,
  spender: string,
  value: bigint,
  account: string,
  gas: GasOptions,
) {
  const allowance = await token.allowance(account, spender);
  if (value > allowance) {
    try {
      const tx = await token.approve(spender, MaxUint256, gas);
      await tx.wait(1);
    } catch (e) {
      if (isCallException(e)) {
        return e.reason;
      }
      throw e;
    }
  }
  return null;
}
export default approve;
