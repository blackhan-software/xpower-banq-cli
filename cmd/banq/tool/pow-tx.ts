import { AbiCoder, type ethers, id, isCallException } from "ethers";
import { pow } from "../../../pow/index.ts";

/**
 * Encode calldata, solve proof-of-work, and send transaction.
 *
 * Used by supply and borrow commands which share identical PoW patterns
 * (selector + address + uint256 + nonce).
 *
 * @returns null on success, or the revert reason string on failure
 */
export async function pow_send(opts: {
  pool: ethers.Contract;
  signer: ethers.Signer;
  selector: string;
  token: string;
  value: bigint;
  difficulty: bigint;
  timeout: number;
  gas: object;
}) {
  const { pool, signer, selector, token, value, difficulty, timeout, gas } =
    opts;
  const sig = id(selector).slice(0, 10);
  const params = AbiCoder.defaultAbiCoder().encode(
    ["address", "uint256", "uint256"],
    [token, value, 0n], // nonce
  );
  const data = sig + params.slice(2);
  try {
    await signer.sendTransaction({
      data: await pow(data, difficulty, {
        address: signer.getAddress(),
        blockHash: pool.blockHash(),
      }, timeout),
      to: pool.target as string,
      ...gas,
    });
  } catch (e) {
    if (isCallException(e)) {
      return e.reason;
    }
    throw e;
  }
  return null;
}
