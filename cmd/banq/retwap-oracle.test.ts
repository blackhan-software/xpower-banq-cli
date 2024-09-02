import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";

import { UNUS } from "../../env/oracles.ts";
import { APOW, XPOW } from "../../env/tokens.ts";

const OPTS = {
  permissions: { env: true },
};
/**
 * @group positive tests
 */
Deno.test("banq -oUNUS [retwap, XPOW, APOW]", OPTS, async () => {
  const args = { oracle: "UNUS", rest: ["retwap", "XPOW", "APOW"] };
  const call = ["retwap", ["XPOW", "APOW"], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test("banq -o0x.. [retwap, XPOW, APOW]", OPTS, async () => {
  const args = { oracle: UNUS, rest: ["retwap", XPOW, APOW] };
  const call = ["retwap", ["XPOW", "APOW"], [false]];
  const next = await cli_next(args as unknown as BanqArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests
 */
Deno.test("banq -oUNUS [retwap]", OPTS, () => {
  const args = { oracle: "UNUS", rest: ["retwap"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("banq -oUNUS [borrow, XYZT]", OPTS, () => {
  const args = { oracle: "UNUS", rest: ["retwap", "XYZT"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: XYZT",
  );
});
Deno.test("banq -oUNUS [borrow, XPOW]", OPTS, () => {
  const args = { oracle: "UNUS", rest: ["retwap", "XPOW"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("banq -oUNUS [borrow, XPOW, XYZT]", OPTS, () => {
  const args = { oracle: "UNUS", rest: ["retwap", "XPOW", "XYZT"] };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: XYZT",
  );
});
