import { assertEquals } from "@std/assert";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";
import { ANVIL_AVAILABLE, startAnvil } from "../anvil.ts";

const OPTS = {
  permissions: { env: true, net: true, run: true },
  sanitizeOps: false,
  sanitizeResources: false,
};

/**
 * @group failure — supply with insufficient APOW balance
 */
Deno.test("banq [supply, 1.0, APOW] insufficient balance", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    // Do not fund — account has zero APOW
    const args = anvil.makeArgs({ rest: ["supply", 1.0, "APOW"] });
    const next = await cli_next(args as BanqArgs);
    const results = next.value![2];
    // Should revert (not [true])
    assertEquals(results[0] !== true, true);
  } finally {
    anvil.stop();
  }
});

/**
 * @group failure — supply with insufficient XPOW balance
 */
Deno.test("banq [supply, 1.0, XPOW] insufficient balance", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    const args = anvil.makeArgs({ rest: ["supply", 1.0, "XPOW"] });
    const next = await cli_next(args as BanqArgs);
    const results = next.value![2];
    assertEquals(results[0] !== true, true);
  } finally {
    anvil.stop();
  }
});

/**
 * @group failure — settle with insufficient balance
 */
Deno.test("banq [settle, 1.0, APOW] insufficient balance", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    const args = anvil.makeArgs({ rest: ["settle", 1.0, "APOW"] });
    const next = await cli_next(args as BanqArgs);
    const results = next.value![2];
    assertEquals(results[0] !== true, true);
  } finally {
    anvil.stop();
  }
});
