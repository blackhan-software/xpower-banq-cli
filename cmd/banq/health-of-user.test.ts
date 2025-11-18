import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";

const OPTS = {
  permissions: { env: true },
};
/**
 * @group positive tests
 */
Deno.test("banq -p P000 [health-of, 0x1n]", OPTS, async () => {
  const args = { pool: "P000", rest: ["health-of", 0x1n] };
  const call = [
    "health-of",
    ["0x0000000000000000000000000000000000000001"],
    [false],
  ];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests
 */
Deno.test("banq -p P000 [health-of]", OPTS, () => {
  const args = { pool: "P000", rest: ["health-of"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("banq -p P000 [health-of, -0x1n]", OPTS, () => {
  const args = { pool: "P000", rest: ["health-of", -0x1n] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid address: -1",
  );
});
Deno.test("banq -p P999 [health-of, 0x1n]", OPTS, () => {
  const args = { pool: "P999", rest: ["health-of", 0x1n] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid pool: P999",
  );
});
