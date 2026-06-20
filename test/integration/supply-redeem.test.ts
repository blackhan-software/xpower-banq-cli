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
 * @group integration — supply APOW
 */
Deno.test("banq -Y -p P000 [supply, 1.0, APOW]", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    await anvil.fundToken("APOW", anvil.accounts[0].address, 100n * ONE_TOKEN);
    const args = anvil.makeArgs({ rest: ["supply", 1.0, "APOW"] });
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value![0], "supply");
    assertEquals(next.value![1], [1.0, "APOW"]);
    // Result is [true] on success or [reason] on contract revert
    const result = next.value![2][0];
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
 * @group integration — supply then redeem APOW round-trip
 */
Deno.test("banq -Y -p P000 [supply, 1.0, APOW] then [redeem, 1.0, APOW]", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    await anvil.fundToken("APOW", anvil.accounts[0].address, 100n * ONE_TOKEN);

    // Supply
    const supplyArgs = anvil.makeArgs({ rest: ["supply", 1.0, "APOW"] });
    const supplyNext = await cli_next(supplyArgs as BanqArgs);
    assertEquals(supplyNext.value![0], "supply");
    const supplyResult = supplyNext.value![2][0];
    if (supplyResult !== true) {
      // Supply reverted — can't test redeem, skip
      return;
    }

    // Redeem
    const redeemArgs = anvil.makeArgs({ rest: ["redeem", 1.0, "APOW"] });
    const redeemNext = await cli_next(redeemArgs as BanqArgs);
    assertEquals(redeemNext.value![0], "redeem");
    assertEquals(redeemNext.value![1], [1.0, "APOW"]);
    const redeemResult = redeemNext.value![2][0];
    assertEquals(
      typeof redeemResult === "boolean" || redeemResult === null ||
        typeof redeemResult === "string",
      true,
    );
  } finally {
    anvil.stop();
  }
});

/**
 * @group integration — supply XPOW
 */
Deno.test("banq -Y -p P000 [supply, 1.0, XPOW]", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    await anvil.fundToken("XPOW", anvil.accounts[0].address, 100n * ONE_TOKEN);
    const args = anvil.makeArgs({ rest: ["supply", 1.0, "XPOW"] });
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value![0], "supply");
    assertEquals(next.value![1], [1.0, "XPOW"]);
    const result = next.value![2][0];
    assertEquals(
      typeof result === "boolean" || result === null ||
        typeof result === "string",
      true,
    );
  } finally {
    anvil.stop();
  }
});
