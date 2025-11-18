import { Decimal } from "decimal.js";
import type { ethers } from "ethers";

import type { Page } from "../../../arg/types.ts";
import { UNIT_DEC } from "../../../constant/index.ts";
import { assert } from "../../../function/assert.ts";

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
  supply_pos: ethers.Contract,
  borrow_pos: ethers.Contract,
  at_index?: number | null,
  page?: Page,
): Promise<Util[]> {
  const vault = vaultOf(
    supply_pos,
    borrow_pos,
    page?.hist_size ?? 0.5e6,
  );
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
      return vault.utilsAt(
        page_index,
        page_size,
        page_step,
      );
    }
    return vault.utilsAt(
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
function vaultOf(
  supply_pos: ethers.Contract,
  borrow_pos: ethers.Contract,
  max_length: number,
) {
  return ({
    utilLength: async () => {
      const events = await eventsOf(
        supply_pos,
        borrow_pos,
        max_length,
      );
      return BigInt(events.length);
    },
    utilsAt: async (
      index: number,
      size: number,
      step: number,
    ) => {
      const events = await eventsOf(
        supply_pos,
        borrow_pos,
        max_length,
      );
      assert(events.length, "missing events");
      const utils = utilsOf(events);
      assert(utils.length, "missing utils");
      const result = utils.slice(
        index,
        index + size * step,
      );
      return result;
    },
    utils: async () => {
      const events = await eventsOf(
        supply_pos,
        borrow_pos,
        max_length,
      );
      assert(events.length, "missing events");
      const utils = utilsOf(events);
      assert(utils.length, "missing utils");
      return utils;
    },
    utilAt: async (index: number) => {
      const events = await eventsOf(
        supply_pos,
        borrow_pos,
        max_length,
      );
      assert(events.length, "missing events");
      const utils = utilsOf(events);
      assert(utils.length, "missing utils");
      return utils[index];
    },
    util: async () => {
      const events = await eventsOf(
        supply_pos,
        borrow_pos,
        max_length,
      );
      assert(events.length, "missing events");
      const utils = utilsOf(events);
      assert(utils.length, "missing utils");
      return utils[utils.length - 1];
    },
  });
}
async function eventsOf(
  supply_pos: ethers.Contract,
  borrow_pos: ethers.Contract,
  max_length: number,
) {
  const [supply_block, borrow_block] = await Promise.all([
    supply_pos.runner?.provider?.getBlockNumber() ?? max_length,
    borrow_pos.runner?.provider?.getBlockNumber() ?? max_length,
  ]);
  const [supply_events, borrow_events] = await Promise.all([
    supply_pos.queryFilter(
      supply_pos.filters.Reindex(),
      supply_block - max_length,
      supply_block,
    ),
    borrow_pos.queryFilter(
      borrow_pos.filters.Reindex(),
      borrow_block - max_length,
      borrow_block,
    ),
  ]);
  const events = [...supply_events, ...borrow_events].sort(
    (a, b) => a.blockNumber - b.blockNumber,
  );
  return events;
}
function utilsOf(
  events: ethers.Log[],
): Util[] {
  const utils = events.map((log: unknown) => {
    const { args: [_, u_wad, stamp] } = log as {
      args: bigint[];
    };
    return {
      meanValue: u_wad,
      timestamp: stamp,
    };
  });
  return utils;
}
export default {
  format,
  retype,
  of,
};
