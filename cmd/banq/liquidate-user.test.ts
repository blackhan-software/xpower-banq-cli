import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";

import { P000 } from "../../env/pools.ts";

const OPTS = {
  permissions: { env: true },
};
/**
 * @group positive tests
 */
Deno.test("banq -p P000 [liquidate, 0x1n]", OPTS, async () => {
  const args = { pool: "P000", rest: ["liquidate", 0x1n] };
  const call = [
    "liquidate",
    ["0x0000000000000000000000000000000000000001", 0],
    [false],
  ];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test("banq -pX [liquidate, 0x1n, 1]", OPTS, async () => {
  const args = { pool: P000, rest: ["liquidate", 0x1n, 1] };
  const call = [
    "liquidate",
    ["0x0000000000000000000000000000000000000001", 1],
    [false],
  ];
  const next = await cli_next(args as unknown as BanqArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests
 */
Deno.test("banq -p P000 [liquidate]", OPTS, () => {
  const args = { pool: "P000", rest: ["liquidate"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("banq -p P000 [liquidate, -0x1n]", OPTS, () => {
  const args = { pool: "P000", rest: ["liquidate", -0x1n] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid address: -1",
  );
});
Deno.test("banq -p P999 [liquidate, 0x1n]", OPTS, () => {
  const args = { pool: "P999", rest: ["liquidate", 0x1n] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid pool: P999",
  );
});
