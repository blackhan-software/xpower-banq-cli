import { assertEquals } from "@std/assert";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";
import { ANVIL_AVAILABLE, startAnvil } from "../anvil.ts";

const OPTS = {
  permissions: { env: true, net: true, run: true },
  sanitizeOps: false,
  sanitizeResources: false,
};

/**
 * @group integration — health-of-user (read-only)
 */
Deno.test("banq -Y -p P000 [health-of, account#0]", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    const args = anvil.makeArgs({
      rest: ["health-of", BigInt(anvil.accounts[0].address)],
    });
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value![0], "health-of");
    // Result is [false] (no positions) or structured data
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
 * @group integration — health-of-user with json flag
 */
Deno.test("banq -Y --json -p P000 [health-of, account#0]", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    const args = anvil.makeArgs({
      json: true,
      rest: ["health-of", BigInt(anvil.accounts[0].address)],
    });
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value![0], "health-of");
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
