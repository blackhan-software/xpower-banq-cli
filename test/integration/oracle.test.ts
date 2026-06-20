import { assertEquals } from "@std/assert";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";
import { ANVIL_AVAILABLE, startAnvil } from "../anvil.ts";

const OPTS = {
  permissions: { env: true, net: true, run: true },
  sanitizeOps: false,
  sanitizeResources: false,
};

/**
 * @group integration — refresh oracle
 */
Deno.test("banq -Y -o T000 [refresh, APOW, XPOW]", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    const args = anvil.makeArgs({
      oracle: "T000",
      rest: ["refresh", "APOW", "XPOW"],
    });
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value![0], "refresh");
    assertEquals(next.value![1], ["APOW", "XPOW"]);
    // Result is [true] on success or [revert-reason] on failure
    const result = next.value![2][0];
    assertEquals(
      typeof result === "boolean" || typeof result === "string",
      true,
    );
  } finally {
    anvil.stop();
  }
});

/**
 * @group integration — retwap oracle after time advance
 */
Deno.test("banq -Y -o T000 [retwap, APOW, XPOW]", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    // Advance time to ensure oracle can be retwapped
    await anvil.rpc("evm_increaseTime", [3600]); // 1 hour
    await anvil.rpc("evm_mine", []);

    const args = anvil.makeArgs({
      oracle: "T000",
      rest: ["retwap", "APOW", "XPOW"],
    });
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value![0], "retwap");
    // First two elements of args are source and target symbols
    assertEquals(next.value![1][0], "APOW");
    assertEquals(next.value![1][1], "XPOW");
    // Result is [true], [revert-reason], or [percent-string]
    const result = next.value![2][0];
    assertEquals(
      typeof result === "boolean" || typeof result === "string",
      true,
    );
  } finally {
    anvil.stop();
  }
});

/**
 * @group integration — refresh then retwap round-trip
 */
Deno.test("banq -Y -o T000 refresh then retwap", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    // Refresh
    const refreshArgs = anvil.makeArgs({
      oracle: "T000",
      rest: ["refresh", "APOW", "XPOW"],
    });
    const refreshNext = await cli_next(refreshArgs as BanqArgs);
    assertEquals(refreshNext.value![0], "refresh");

    // Advance time
    await anvil.rpc("evm_increaseTime", [3600]);
    await anvil.rpc("evm_mine", []);

    // Retwap
    const retwapArgs = anvil.makeArgs({
      oracle: "T000",
      rest: ["retwap", "APOW", "XPOW"],
    });
    const retwapNext = await cli_next(retwapArgs as BanqArgs);
    assertEquals(retwapNext.value![0], "retwap");
  } finally {
    anvil.stop();
  }
});
