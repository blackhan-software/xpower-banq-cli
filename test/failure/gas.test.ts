import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";
import { ANVIL_AVAILABLE, startAnvil } from "../anvil.ts";

const OPTS = {
  permissions: { env: true, net: true, run: true },
  sanitizeOps: false,
  sanitizeResources: false,
};

/**
 * @group failure — invalid private key
 */
Deno.test("banq [supply, 1.0, APOW] invalid private-key", OPTS, () => {
  const args = {
    broadcast: true,
    pool: "P000",
    provider_url: "http://127.0.0.1:8545",
    private_key: "not-a-key",
    rest: ["supply", 1.0, "APOW"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid private-key",
  );
});

/**
 * @group failure — borrow without collateral reverts
 */
Deno.test("banq [borrow, 1.0, XPOW] no collateral", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    const args = anvil.makeArgs({
      rest: ["borrow", 1.0, "XPOW"],
    });
    const next = await cli_next(args as BanqArgs);
    // Should return a revert reason (not [true])
    const results = next.value![2];
    assertEquals(results[0] !== true, true);
  } finally {
    anvil.stop();
  }
});
