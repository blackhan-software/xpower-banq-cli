import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";

import { BNQ1 } from "../../env/pools.ts";

const OPTS = {
  permissions: { env: true },
};
/**
 * @group positive tests
 */
Deno.test("banq -p1 [health-of, 0x1n]", OPTS, async () => {
  const args = { pool: 1, rest: ["health-of", 0x1n] };
  const call = ["health-of", ["0x1"], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test("banq -pX [health-of, 0x1n]", OPTS, async () => {
  const args = { pool: BNQ1, rest: ["health-of", 0x1n] };
  const call = ["health-of", ["0x1"], [false]];
  const next = await cli_next(args as unknown as BanqArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests
 */
Deno.test("banq -p1 [health-of]", OPTS, () => {
  const args = { pool: 1, rest: ["health-of"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("banq -p1 [health-of, -0x1n]", OPTS, () => {
  const args = { pool: 1, rest: ["health-of", -0x1n] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid address: -1",
  );
});
Deno.test("banq -p0 [health-of, 0x1n]", OPTS, () => {
  const args = { pool: 0, rest: ["health-of", 0x1n] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid pool: 0",
  );
});
