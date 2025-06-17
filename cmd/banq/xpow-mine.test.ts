import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../tool/address.ts";

const OPTS = {
  permissions: { env: true },
};
/**
 * @group positive tests
 */
Deno.test("banq [xpow-mine, XPOW]", OPTS, async () => {
  const args = { to: 0n, pow_level: 0, rest: ["xpow-mine", "XPOW"] };
  const call = ["xpow-mine", ["XPOW", x(0n), 0], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test("banq [xpow-mine]", OPTS, async () => {
  const args = { to: 1n, pow_level: 64, rest: ["xpow-mine"] };
  const call = ["xpow-mine", ["XPOW", x(1n), 64], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests
 */
Deno.test("banq [xpow-mine, XPOW]", OPTS, () => {
  const args = { to: 1n, pow_level: 65, rest: ["xpow-mine", "XPOW"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid pow-level: 65",
  );
});
Deno.test("banq [xpow-mine, ABCD]", OPTS, () => {
  const args = { to: 1n, pow_level: 1, rest: ["xpow-mine", "ABCD"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: ABCD",
  );
});
