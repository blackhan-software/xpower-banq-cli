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
Deno.test("banq -p1 [rates-of, APOW]", OPTS, async () => {
  const args = { pool: 1, rest: ["rates-of", "APOW"] };
  const call = ["rates-of", ["APOW"], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test(`banq -p1 [rates-of, ${abbressOf(APOW)}]`, OPTS, async () => {
  const args = { pool: 1, rest: ["rates-of", APOW] };
  const call = ["rates-of", ["APOW"], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test("banq -p1 [rates-of, XPOW]", OPTS, async () => {
  const args = { pool: BNQ1, rest: ["rates-of", "XPOW"] } as unknown;
  const call = ["rates-of", ["XPOW"], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test(`banq -p1 [rates-of, ${abbressOf(XPOW)}]`, OPTS, async () => {
  const args = { pool: BNQ1, rest: ["rates-of", XPOW] } as unknown;
  const call = ["rates-of", ["XPOW"], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests
 */
Deno.test("banq -p1 [rates-of]", OPTS, () => {
  const args = { pool: 1, rest: ["rates-of"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("banq -p1 [rates-of, XYZT]", OPTS, () => {
  const args = { pool: 1, rest: ["rates-of", "XYZT"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: XYZT",
  );
});
Deno.test("banq -p0 [rates-of, APOW]", OPTS, () => {
  const args = { pool: 0, rest: ["rates-of", "APOW"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid pool: 0",
  );
});