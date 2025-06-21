import { type IHasher, KeccakHasher } from "@blackhan-software/wasm-miner";
import { solidityPacked } from "ethers";

type Options = Parameters<IHasher["reduce"]>[1];
const PERIOD_MS = 3_600_000; // PoW interval

export class Miner {
  async init(
    contract: bigint,
    address: bigint,
    block_hash: string,
    nonce_length: number,
  ) {
    const hasher = await KeccakHasher();
    const array = this.abi_encode(
      contract,
      address,
      block_hash,
      nonce_length,
    );
    return (options: Options) => hasher.reduce(array, options);
  }
  abi_encode(
    contract: bigint,
    address: bigint,
    block_hash: string,
    nonce_length: number,
  ) {
    const template = solidityPacked(
      ["uint160", "bytes32", "bytes"],
      [
        contract ^ address,
        block_hash,
        new Uint8Array(nonce_length),
      ],
    );
    return arrayify(template.slice(2));
  }
  static expired(timestamp: Date) {
    return this.interval() > this.interval(timestamp);
  }
  static interval(now = new Date()) {
    return BigInt(Math.floor(now.getTime() / PERIOD_MS));
  }
}
function arrayify(data: string, list: number[] = []) {
  for (let i = 0; i < data.length; i += 2) {
    list.push(parseInt(data.substring(i, i + 2), 16));
  }
  return new Uint8Array(list);
}
export default Miner;
