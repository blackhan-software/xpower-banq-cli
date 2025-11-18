import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";

const OPTS = {
  permissions: { env: true },
};
/**
 * @group positive tests
 */
Deno.test("banq -p P000 [supply, 1.0, APOW]", OPTS, async () => {
  const args = { pool: "P000", rest: ["supply", 1.0, "APOW"] };
  const call = ["supply", [1.0, "APOW"], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test("banq -p P000 [supply, 1.0, XPOW]", OPTS, async () => {
  const args = { pool: "P000", rest: ["supply", 1.0, "XPOW"] } as unknown;
  const call = ["supply", [1.0, "XPOW"], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests
 */
Deno.test("banq -p P000 [supply]", OPTS, () => {
  const args = { pool: "P000", rest: ["supply"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("banq -p P000 [supply, -1.0]", OPTS, () => {
  const args = { pool: "P000", rest: ["supply", -1.0] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid amount: -1",
  );
});
Deno.test("banq -p P000 [supply, 1.0]", OPTS, () => {
  const args = { pool: "P000", rest: ["supply", 1.0] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("banq -p P000 [supply, 1.0, XYZT]", OPTS, () => {
  const args = { pool: "P000", rest: ["supply", 1.0, "XYZT"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: XYZT",
  );
});
Deno.test("banq -p P999 [supply, 1.0, APOW]", OPTS, () => {
  const args = { pool: "P999", rest: ["supply", 1.0, "APOW"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid pool: P999",
  );
});
