import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";

const OPTS = {
  permissions: { env: true },
};
/**
 * @group positive tests
 */
Deno.test("banq -oT000 [refresh, XPOW, APOW]", OPTS, async () => {
  const args = { oracle: "T000", rest: ["refresh", "XPOW", "APOW"] };
  const call = ["refresh", ["XPOW", "APOW"], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests
 */
Deno.test("banq -oT000 [refresh]", OPTS, () => {
  const args = { oracle: "T000", rest: ["refresh"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("banq -oT000 [borrow, XYZT]", OPTS, () => {
  const args = { oracle: "T000", rest: ["refresh", "XYZT"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: XYZT",
  );
});
Deno.test("banq -oT000 [borrow, XPOW]", OPTS, () => {
  const args = { oracle: "T000", rest: ["refresh", "XPOW"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("banq -oT000 [borrow, XPOW, XYZT]", OPTS, () => {
  const args = { oracle: "T000", rest: ["refresh", "XPOW", "XYZT"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: XYZT",
  );
});
