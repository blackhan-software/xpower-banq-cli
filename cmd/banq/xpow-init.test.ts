import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";

const OPTS = {
  permissions: { env: true },
};
/**
 * @group positive tests
 */
Deno.test("banq [xpow-init, XPOW]", OPTS, async () => {
  const args = { rest: ["xpow-init", "XPOW"] };
  const call = ["xpow-init", ["XPOW"], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test("banq [xpow-init]", OPTS, async () => {
  const args = { rest: ["xpow-init"] };
  const call = ["xpow-init", ["XPOW"], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests
 */
Deno.test("banq [xpow-init, ABCD]", OPTS, () => {
  const args = { rest: ["xpow-init", "ABCD"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: ABCD",
  );
});
Deno.test("banq [xpow-init, --broadcast, --retry=0]", OPTS, () => {
  const args = { broadcast: true, retry: 0, rest: ["xpow-init"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid retry: 0",
  );
});
Deno.test("banq [xpow-init, --broadcast, --gas-factor=0]", OPTS, () => {
  const args = { broadcast: true, retry_gas_factor: 0, rest: ["xpow-init"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid retry-gas-factor: 0",
  );
});
