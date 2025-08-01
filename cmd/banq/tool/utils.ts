import { assert } from "../../../function/assert.ts";
import { Decimal } from "decimal.js";
import type { ethers } from "ethers";
import type { Page } from "../../../arg/types.ts";
import { UNIT_DEC } from "../../../constant/index.ts";

export type Util = {
  meanValue: bigint;
  timestamp: bigint;
};
export function format(
  util: Util,
  digits: number,
) {
  const { meanValue, timestamp } = retype(util);
  return {
    meanValue: meanValue.toExponential(digits),
    timestamp: timestamp.toISOString().split(".")[0],
  };
}
export function retype(
  { meanValue, timestamp }: Util,
) {
  return {
    meanValue: new Decimal(meanValue.toString()).div(UNIT_DEC),
    timestamp: new Date(Number(1000n * timestamp)),
  };
}
export async function of(
  s_pos: ethers.Contract,
  b_pos: ethers.Contract,
  vault: ethers.Contract,
  at_index?: number | null,
  page?: Page,
): Promise<Util[]> {
  //
  // page: non-null, size: 10?, step: 1?
  //
  if (page && page.page !== null) {
    const page_size = page.page_size ?? 10;
    assert(page_size > 0, "invalid page-size");
    const page_step = page.page_step ?? 1;
    assert(page_step > 0, "invalid page-step");
    if (page.page < 0) {
      const length = await vaultOf(s_pos, b_pos).utilLength() as bigint;
      const page_length = Math.ceil(Number(length) / page_size);
      const page_index = page.page % page_length + page_length;
      return vaultOf(s_pos, b_pos).utilsAt(
        page_index,
        page_size,
        page_step,
      );
    }
    return vaultOf(s_pos, b_pos).utilsAt(
      page.page,
      page_size,
      page_step,
    );
  }
  //
  // at-index: now
  //
  if (at_index === null || at_index === undefined) {
    const util = vault.util();
    return util.then((u) => [u]);
  }
  //
  // at-index: all
  //
  if (at_index === Infinity) {
    return vault.utils();
  }
  //
  // at-index: negative
  //
  if (at_index < 0) {
    const length = await vault.utilLength() as bigint;
    const util = vault.utilAt(at_index + Number(length));
    return util.then((u) => [u]);
  }
  //
  // at-index: positive
  //
  const util = vault.utilAt(at_index);
  return util.then((u) => [u]);
}
export function vaultOf(
  s_pos: ethers.Contract,
  b_pos: ethers.Contract,
) {
  const s_filter = s_pos.filters.Reindex();
  const b_filter = b_pos.filters.Reindex();
  return ({
    utilLength: async () => {
      const [s_length, b_length] = await Promise.all([
        s_pos.utilLength(),
        b_pos.utilLength(),
      ]);
      return s_length + b_length;
    },
    utilsAt: async (
      index: number,
      size: number,
      step: number,
    ) => {
      const [s_block, b_block] = await Promise.all([
        s_pos.runner.provider.getBlockNumber(),
        b_pos.runner.provider.getBlockNumber(),
      ]);
      const [s_events, b_events] = await Promise.all([
        s_pos.queryFilter(s_filter, s_block - 2 ** 18, s_block),
        b_pos.queryFilter(b_filter, b_block - 2 ** 18, b_block),
      ]);
      const events = [...s_events, ...b_events].sort(
        (a, b) => a.blockNumber - b.blockNumber,
      );
      assert(events.length > 0, "missing events");
      const [s_utils, b_utils] = await Promise.all([
        s_pos.utilsAt(index, size, step),
        b_pos.utilsAt(index, size, step),
      ]);
      return [...s_utils, ...b_utils];
    },
  });
}
export default {
  format,
  retype,
  of,
};
