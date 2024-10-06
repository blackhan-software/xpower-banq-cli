import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";
import { abbressOf } from "../../tool/address.ts";

import { APOW, XPOW } from "../../env/tokens.ts";
import { BNQ1 } from "../../env/pools.ts";

const OPTS = {
  permissions: { env: true },
};
/**
 * @group positive tests
 */
Deno.test("banq -p1 [redeem, 1.0, APOW]", OPTS, async () => {
  const args = { pool: 1, rest: ["redeem", 1.0, "APOW"] };
  const call = ["redeem", [1.0, "APOW"], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test(`banq -p1 [redeem, 1.0, ${abbressOf(APOW)}]`, OPTS, async () => {
  const args = { pool: 1, rest: ["redeem", 1.0, APOW] };
  const call = ["redeem", [1.0, "APOW"], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test("banq -p1 [redeem, 1.0, XPOW]", OPTS, async () => {
  const args = { pool: BNQ1, rest: ["redeem", 1.0, "XPOW"] } as unknown;
  const call = ["redeem", [1.0, "XPOW"], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test(`banq -p1 [redeem, 1.0, ${abbressOf(XPOW)}]`, OPTS, async () => {
  const args = { pool: BNQ1, rest: ["redeem", 1.0, XPOW] } as unknown;
  const call = ["redeem", [1.0, "XPOW"], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests
 */
Deno.test("banq -p1 [redeem]", OPTS, () => {
  const args = { pool: 1, rest: ["redeem"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("banq -p1 [redeem, -1.0]", OPTS, () => {
  const args = { pool: 1, rest: ["redeem", -1.0] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid amount: -1",
  );
});
Deno.test("banq -p1 [redeem, 1.0]", OPTS, () => {
  const args = { pool: 1, rest: ["redeem", 1.0] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("banq -p1 [redeem, 1.0, XYZT]", OPTS, () => {
  const args = { pool: 1, rest: ["redeem", 1.0, "XYZT"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: XYZT",
  );
});
Deno.test("banq -p0 [redeem, 1.0, APOW]", OPTS, () => {
  const args = { pool: 0, rest: ["redeem", 1.0, "APOW"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid pool: 0",
  );
});
