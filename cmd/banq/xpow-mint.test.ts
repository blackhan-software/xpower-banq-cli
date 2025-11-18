import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";
import { address_by } from "../../env/find-by.ts";

const OPTS = {
  permissions: { env: true },
};
/**
 * @group positive tests
 */
Deno.test("banq [xpow-mint]", OPTS, async () => {
  const args = { rest: ["xpow-mint"] };
  const call = ["xpow-mint", [address_by("XPOW", "v10a")], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test("banq [xpow-mint, XPOW]", OPTS, async () => {
  const args = { rest: ["xpow-mint", "XPOW"] };
  const call = ["xpow-mint", [address_by("XPOW", "v10a")], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests
 */
Deno.test("banq [xpow-mint, ABCD]", OPTS, () => {
  const args = { rest: ["xpow-mint", "ABCD"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: ABCD",
  );
});
