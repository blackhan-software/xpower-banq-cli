export type NonceData = {
  amount: number;
  block_hash: string;
  hash: string;
  interval: number;
  nonce: string;
  now: string;
  to: string;
};

/**
 * Accumulates mined nonces and groups them into batches. A batch is only
 * valid when every entry shares the same `to` and `block_hash`, so a group
 * is drained early whenever an entry from a different group arrives.
 */
export class NonceBatch {
  #buffer: NonceData[] = [];
  #size: number;
  constructor(size: number) {
    this.#size = size;
  }
  get pending(): number {
    return this.#buffer.length;
  }
  /**
   * Append a nonce, returning a ready group when the batch is full or when
   * `data` belongs to a different `(to, block_hash)` group; else `null`.
   */
  push(data: NonceData): NonceData[] | null {
    const head = this.#buffer[0];
    if (head && (head.to !== data.to || head.block_hash !== data.block_hash)) {
      const group = this.#buffer;
      this.#buffer = [data];
      return group;
    }
    this.#buffer.push(data);
    if (this.#buffer.length >= this.#size) {
      return this.flush();
    }
    return null;
  }
  /**
   * Drain and return any pending nonces (e.g. on end-of-stream).
   */
  flush(): NonceData[] {
    const group = this.#buffer;
    this.#buffer = [];
    return group;
  }
}
