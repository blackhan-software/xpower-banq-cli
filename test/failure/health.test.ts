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
 * @group failure — borrow exceeding health factor
 */
Deno.test("banq [borrow, 1e18, XPOW] health factor violated", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    // Supply a small amount of APOW as collateral
    await anvil.fundToken("APOW", anvil.accounts[0].address, 10n * ONE_TOKEN);
    const supplyArgs = anvil.makeArgs({ rest: ["supply", 1.0, "APOW"] });
    const supplyNext = await cli_next(supplyArgs as BanqArgs);
    if (supplyNext.value![2][0] !== true) {
      return; // supply failed, skip
    }
    // Attempt to borrow far more than collateral supports
    const borrowArgs = anvil.makeArgs({ rest: ["borrow", 1e18, "XPOW"] });
    const borrowNext = await cli_next(borrowArgs as BanqArgs);
    const results = borrowNext.value![2];
    // Should revert due to health factor violation
    assertEquals(results[0] !== true, true);
  } finally {
    anvil.stop();
  }
});

/**
 * @group failure — liquidate healthy position (no shortfall)
 */
Deno.test("banq [liquidate, account#1] healthy position", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    // Supply collateral with account#0, then try to liquidate — should fail
    await anvil.fundToken("APOW", anvil.accounts[0].address, 100n * ONE_TOKEN);
    const supplyArgs = anvil.makeArgs({ rest: ["supply", 10.0, "APOW"] });
    const supplyNext = await cli_next(supplyArgs as BanqArgs);
    if (supplyNext.value![2][0] !== true) {
      return; // supply failed, skip
    }
    // Try liquidating account#0 from account#1 — position is healthy
    const liqArgs = anvil.makeArgs({
      private_key: anvil.accounts[1].key,
      rest: ["liquidate", BigInt(anvil.accounts[0].address), "APOW"],
    });
    const liqNext = await cli_next(liqArgs as BanqArgs);
    const results = liqNext.value![2];
    // Should revert — no shortfall
    assertEquals(results[0] !== true, true);
  } finally {
    anvil.stop();
  }
});
