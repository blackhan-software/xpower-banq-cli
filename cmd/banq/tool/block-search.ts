import type { ethers } from "ethers";

/**
 * Binary search for the deployment block of a contract.
 * Returns the earliest block where the contract has code.
 */
export async function blockSearch(
  provider: ethers.Provider,
  address: string,
  label = "contract",
): Promise<number> {
  const code = await provider.getCode(address, "latest");
  if (!code || code === "0x") {
    throw new Error(`${label} not deployed at ${address}`);
  }
  let [lo, hi] = [0, await provider.getBlockNumber()];
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const mid_code = await provider.getCode(address, mid);
    if (!mid_code || mid_code === "0x") {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}
export default blockSearch;
