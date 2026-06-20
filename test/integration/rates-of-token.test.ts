import { assertEquals } from "@std/assert";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";
import { ANVIL_AVAILABLE, startAnvil } from "../anvil.ts";

const OPTS = {
  permissions: { env: true, net: true, run: true },
  sanitizeOps: false,
  sanitizeResources: false,
};

/**
 * @group integration — rates-of-token APOW (read-only)
 */
Deno.test("banq -Y -p P000 [rates-of, APOW]", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    const args = anvil.makeArgs({ model: true, rest: ["rates-of", "APOW"] });
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value![0], "rates-of");
    assertEquals(next.value![1], ["APOW"]);
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
 * @group integration — rates-of-token XPOW (read-only)
 */
Deno.test("banq -Y -p P000 [rates-of, XPOW]", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    const args = anvil.makeArgs({ model: true, rest: ["rates-of", "XPOW"] });
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value![0], "rates-of");
    assertEquals(next.value![1], ["XPOW"]);
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
