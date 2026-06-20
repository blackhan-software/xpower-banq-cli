import { AbiCoder, type Addressable, ethers, id } from "ethers";
import type { RunVersion } from "../../../arg/types.ts";

/**
 * @returns the encoded data for supplying to a pool
 */
export function supplyData(
  account: string,
  token: string | Addressable,
  amount: bigint,
  run: RunVersion,
): string {
  if (run < "v10b") {
    const selector = id("supply(address,address,uint256,bool)");
    const args = AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256", "bool", "uint256"],
      [account, token, amount, true, 0n], // nonce
    );
    return selector.slice(0, 10) + args.slice(2);
  }
  const selector = id("supply(address,address,uint256,uint256)");
  const args = AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "uint256", "uint256", "uint256"],
    [account, token, amount, ethers.MaxUint256, 0n], // nonce
  );
  return selector.slice(0, 10) + args.slice(2);
}
export default supplyData;
