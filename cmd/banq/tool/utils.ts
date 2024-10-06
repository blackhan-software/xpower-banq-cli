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
      const length = await vault.utilLength() as bigint;
      const page_length = Math.ceil(Number(length) / page_size);
      const page_index = page.page % page_length + page_length;
      return vault.utilsAt(page_index, page_size, page_step);
    }
    return vault.utilsAt(page.page, page_size, page_step);
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
export default {
  format,
  retype,
  of,
};
