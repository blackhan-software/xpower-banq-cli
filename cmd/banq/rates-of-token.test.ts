import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";

const OPTS = {
  permissions: { env: true },
};
/**
 * @group positive tests
 */
Deno.test("banq -p P000 [rates-of, APOW]", OPTS, async () => {
  const args = { pool: "P000", rest: ["rates-of", "APOW"] };
  const call = ["rates-of", ["APOW"], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test("banq -p P000 [rates-of, XPOW]", OPTS, async () => {
  const args = { pool: "P000", rest: ["rates-of", "XPOW"] } as unknown;
  const call = ["rates-of", ["XPOW"], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests
 */
Deno.test("banq -p P000 [rates-of]", OPTS, () => {
  const args = { pool: "P000", rest: ["rates-of"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("banq -p P000 [rates-of, XYZT]", OPTS, () => {
  const args = { pool: "P000", rest: ["rates-of", "XYZT"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: XYZT",
  );
});
Deno.test("banq -p P999 [rates-of, APOW]", OPTS, () => {
  const args = { pool: "P999", rest: ["rates-of", "APOW"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid pool: P999",
  );
});
