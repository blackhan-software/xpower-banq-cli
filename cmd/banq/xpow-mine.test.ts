import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";
import { addressOf as x } from "../../function/address.ts";

const OPTS = {
  permissions: { env: true },
};
/**
 * @group positive tests
 */
Deno.test("banq [xpow-mine]", OPTS, async () => {
  const args = { rest: ["xpow-mine"] };
  const call = ["xpow-mine", ["XPOW", 8, 8, x(0n)], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test(
  "banq [xpow-mine, XPOW, to=0x0..0, pow-level=1, nonce-length=8]",
  OPTS,
  async () => {
    const args = {
      to: 0n,
      pow_level: 1,
      nonce_length: 8,
      rest: ["xpow-mine", "XPOW"],
    };
    const call = [
      "xpow-mine",
      ["XPOW", 1, 8, "0x0000000000000000000000000000000000000000"],
      [false],
    ];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);
Deno.test(
  "banq [xpow-mine, to=0x0..1, pow-level=64, nonce-length=16]",
  OPTS,
  async () => {
    const args = {
      to: 1n,
      pow_level: 64,
      nonce_length: 16,
      rest: ["xpow-mine", "XPOW"],
    };
    const call = [
      "xpow-mine",
      ["XPOW", 64, 16, "0x0000000000000000000000000000000000000001"],
      [false],
    ];
    const next = await cli_next(args as BanqArgs);
    assertEquals(next.value, call);
  },
);
/**
 * @group negative tests
 */
Deno.test("banq [xpow-mine, pow-level=65]", OPTS, () => {
  const args = { pow_level: 65, rest: ["xpow-mine"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid pow-level: 65",
  );
});
Deno.test("banq [xpow-mine, to=-1]", OPTS, () => {
  const args = { to: -1n, rest: ["xpow-mine"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid address: -1",
  );
});
Deno.test("banq [xpow-mine, nonce-length=-1]", OPTS, () => {
  const args = { nonce_length: -1, rest: ["xpow-mine"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid nonce-length: -1",
  );
});
Deno.test("banq [xpow-mine, ABCD]", OPTS, () => {
  const args = { rest: ["xpow-mine", "ABCD"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: ABCD",
  );
});
