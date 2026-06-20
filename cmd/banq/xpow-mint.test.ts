import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";

const OPTS = {
  permissions: { env: true },
};
/**
 * @group positive tests
 */
Deno.test("banq [xpow-mint]", OPTS, async () => {
  const args = { rest: ["xpow-mint"] };
  const call = ["xpow-mint", ["XPOW", 1], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test("banq [xpow-mint, XPOW]", OPTS, async () => {
  const args = { rest: ["xpow-mint", "XPOW"] };
  const call = ["xpow-mint", ["XPOW", 1], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test("banq [xpow-mint, --batch-size=4]", OPTS, async () => {
  const args = { batch_size: 4, rest: ["xpow-mint", "XPOW"] };
  const call = ["xpow-mint", ["XPOW", 4], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
/**
 * @group positive tests — json flag
 */
Deno.test("banq --json [xpow-mint]", OPTS, async () => {
  const args = { json: true, rest: ["xpow-mint"] };
  const call = ["xpow-mint", ["XPOW", 1], [false]];
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
Deno.test("banq [xpow-mint, --batch-size=0]", OPTS, () => {
  const args = { batch_size: 0, rest: ["xpow-mint"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid batch-size: 0",
  );
});
Deno.test("banq [xpow-mint, --batch-size=-1]", OPTS, () => {
  const args = { batch_size: -1, rest: ["xpow-mint"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid batch-size: -1",
  );
});
