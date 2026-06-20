import { type Addressable, ethers } from "ethers";
import type { RunVersion } from "../../../arg/types.ts";
import { pool_abi } from "../abi/abis.ts";

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
export default poolOf;
