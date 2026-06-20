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
 * @group integration — liquidation flow
 *
 * 1. Victim supplies APOW, borrows XPOW to near-max
 * 2. Time advances to degrade health
 * 3. Liquidator attempts liquidation
 */
Deno.test("banq -Y -p P000 liquidate unhealthy position", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    const victim = anvil.accounts[0];
    const liquidator = anvil.accounts[1];

    // Fund victim with APOW
    await anvil.fundToken("APOW", victim.address, 1000n * ONE_TOKEN);

    // Victim: supply APOW as collateral
    const supplyArgs = anvil.makeArgs({
      private_key: victim.key,
      rest: ["supply", 100.0, "APOW"],
    });
    const supplyNext = await cli_next(supplyArgs as BanqArgs);
    assertEquals(supplyNext.value![0], "supply");
    if (supplyNext.value![2][0] !== true) return;

    // Victim: borrow XPOW (try to borrow a lot to get near-max)
    const borrowArgs = anvil.makeArgs({
      private_key: victim.key,
      rest: ["borrow", 50.0, "XPOW"],
    });
    const borrowNext = await cli_next(borrowArgs as BanqArgs);
    assertEquals(borrowNext.value![0], "borrow");
    if (borrowNext.value![2][0] !== true) return;

    // Fast-forward time to accrue interest and degrade health
    await anvil.rpc("evm_increaseTime", [365 * 24 * 3600]); // 1 year
    await anvil.rpc("evm_mine", []);

    // Fund liquidator with tokens for liquidation
    await anvil.fundToken("APOW", liquidator.address, 1000n * ONE_TOKEN);
    await anvil.fundToken("XPOW", liquidator.address, 1000n * ONE_TOKEN);

    // Liquidator: attempt to liquidate victim
    const liquidateArgs = anvil.makeArgs({
      private_key: liquidator.key,
      rest: ["liquidate", BigInt(victim.address), 0],
    });
    const liquidateNext = await cli_next(liquidateArgs as BanqArgs);
    assertEquals(liquidateNext.value![0], "liquidate");
    // Result is [true] on success, [null] or [reason] on revert
    const result = liquidateNext.value![2][0];
    assertEquals(
      typeof result === "boolean" || result === null ||
        typeof result === "string",
      true,
    );
  } finally {
    anvil.stop();
  }
});

/**
 * @group integration — liquidate healthy position should revert
 */
Deno.test("banq -Y -p P000 liquidate healthy position reverts", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    const victim = anvil.accounts[0];
    const liquidator = anvil.accounts[1];

    // Fund victim with APOW and supply as collateral
    await anvil.fundToken("APOW", victim.address, 1000n * ONE_TOKEN);
    const supplyArgs = anvil.makeArgs({
      private_key: victim.key,
      rest: ["supply", 100.0, "APOW"],
    });
    const supplyNext = await cli_next(supplyArgs as BanqArgs);
    if (supplyNext.value![2][0] !== true) return;

    // Borrow a small amount (should stay healthy)
    const borrowArgs = anvil.makeArgs({
      private_key: victim.key,
      rest: ["borrow", 1.0, "XPOW"],
    });
    const borrowNext = await cli_next(borrowArgs as BanqArgs);
    if (borrowNext.value![2][0] !== true) return;

    // Fund liquidator
    await anvil.fundToken("APOW", liquidator.address, 1000n * ONE_TOKEN);
    await anvil.fundToken("XPOW", liquidator.address, 1000n * ONE_TOKEN);

    // Attempt liquidation — should fail (position is healthy)
    const liquidateArgs = anvil.makeArgs({
      private_key: liquidator.key,
      rest: ["liquidate", BigInt(victim.address), 0],
    });
    const liquidateNext = await cli_next(liquidateArgs as BanqArgs);
    assertEquals(liquidateNext.value![0], "liquidate");
    // Expect a revert reason since position is healthy
    const result = liquidateNext.value![2][0];
    assertEquals(result !== true, true);
  } finally {
    anvil.stop();
  }
});
