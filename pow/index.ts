import { type IHasher, KeccakHasher } from "@blackhan-software/wasm-miner";
import { getBytes, hexlify } from "ethers";

export async function pow(
  data: string, difficulty: bigint, ctx: {
    blockHash: Promise<string>;
    address: Promise<string>;
  },
): Promise<string> {
  const [address, blockHash, hasher] = await Promise.all([
    ctx.address.then((a) => a.slice(2)), ctx.blockHash,
    KeccakHasher(),
  ]);
  const bytes = getBytes(blockHash + address + data.slice(2));
  return pow_base(hasher, Number(difficulty), bytes);
}
async function pow_base(
  hasher: IHasher, zeros: number, bytes: Uint8Array,
): Promise<string> {
  const step = BigInt(4 ** zeros);
  for (let i = 0n; true; i++) {
    const range: [bigint, bigint] = [step * i, step * (i + 1n)];
    const nonce = await pow_wasm(hasher, bytes, range, zeros);
    if (nonce < 0n) continue; // failed; retry!
    bytes[bytes.length - 8] = Number((nonce >> 56n) & 0xffn);
    bytes[bytes.length - 7] = Number((nonce >> 48n) & 0xffn);
    bytes[bytes.length - 6] = Number((nonce >> 40n) & 0xffn);
    bytes[bytes.length - 5] = Number((nonce >> 32n) & 0xffn);
    bytes[bytes.length - 4] = Number((nonce >> 24n) & 0xffn);
    bytes[bytes.length - 3] = Number((nonce >> 16n) & 0xffn);
    bytes[bytes.length - 2] = Number((nonce >> 8n) & 0xffn);
    bytes[bytes.length - 1] = Number((nonce >> 0n) & 0xffn);
    return "0x" + hexlify(bytes).slice(106); // 2 + 64 + 40
  }
}
function pow_wasm(
  hasher: IHasher,
  bytes: Uint8Array,
  range: [bigint, bigint],
  zeros: number,
): Promise<bigint> {
  return new Promise((resolve) => {
    hasher.reduce(bytes, {
      callback: resolve,
      range,
      zeros,
    });
    resolve(-1n);
  });
}
