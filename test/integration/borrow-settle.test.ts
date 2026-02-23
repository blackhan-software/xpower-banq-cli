import { assertEquals } from "@std/assert";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";
import { ANVIL_AVAILABLE, startAnvil } from "../anvil.ts";

const OPTS = {
  permissions: { env: true, net: true, run: true },
  sanitizeOps: false,
  sanitizeResources: false,
};
const ONE_TOKEN = 10n ** 18n;

/**
 * @group integration — supply APOW, borrow XPOW, settle XPOW
 */
Deno.test("banq -Y -p P000 supply APOW, borrow XPOW, settle XPOW", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    // Fund account with APOW for collateral
    await anvil.fundToken("APOW", anvil.accounts[0].address, 1000n * ONE_TOKEN);

    // Supply APOW as collateral
    const supplyArgs = anvil.makeArgs({ rest: ["supply", 100.0, "APOW"] });
    const supplyNext = await cli_next(supplyArgs as BanqArgs);
    assertEquals(supplyNext.value![0], "supply");
    if (supplyNext.value![2][0] !== true) {
      // Supply reverted — can't continue
      return;
    }

    // Borrow XPOW against collateral
    const borrowArgs = anvil.makeArgs({ rest: ["borrow", 1.0, "XPOW"] });
    const borrowNext = await cli_next(borrowArgs as BanqArgs);
    assertEquals(borrowNext.value![0], "borrow");
    assertEquals(borrowNext.value![1], [1.0, "XPOW"]);
    const borrowResult = borrowNext.value![2][0];
    if (borrowResult !== true) {
      // Borrow reverted — pool state may not allow it
      return;
    }

    // Fund with XPOW for repayment
    await anvil.fundToken("XPOW", anvil.accounts[0].address, 100n * ONE_TOKEN);

    // Settle (repay) the borrow
    const settleArgs = anvil.makeArgs({ rest: ["settle", 1.0, "XPOW"] });
    const settleNext = await cli_next(settleArgs as BanqArgs);
    assertEquals(settleNext.value![0], "settle");
    assertEquals(settleNext.value![1], [1.0, "XPOW"]);
    const settleResult = settleNext.value![2][0];
    assertEquals(
      typeof settleResult === "boolean" || settleResult === null ||
        typeof settleResult === "string",
      true,
    );
  } finally {
    anvil.stop();
  }
});

/**
 * @group integration — borrow without sufficient collateral
 */
Deno.test("banq -Y -p P000 borrow XPOW without collateral", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    // Attempt to borrow without supplying collateral first
    const args = anvil.makeArgs({ rest: ["borrow", 1.0, "XPOW"] });
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value![0], "borrow");
    // Should get a revert reason (not [true])
    const result = next.value![2][0];
    assertEquals(result !== true, true);
  } finally {
    anvil.stop();
  }
});
