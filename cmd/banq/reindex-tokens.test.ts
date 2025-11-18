import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";

const OPTS = {
  permissions: { env: true },
};
/**
 * @group positive tests
 */
Deno.test("banq -p P000 -M supply [reindex, APOW]", OPTS, async () => {
  const args = {
    pool: "P000",
    mode: "supply",
    rest: ["reindex", "APOW"],
  };
  const call = ["reindex", ["sAPOW", false], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test("banq -p P000 -M supply [reindex, XPOW]", OPTS, async () => {
  const args = {
    pool: "P000",
    mode: "supply",
    rest: ["reindex", "XPOW"],
  };
  const call = ["reindex", ["sXPOW", false], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests
 */
Deno.test("banq -p P000 -M supply [reindex]", OPTS, () => {
  const args = {
    pool: "P000",
    mode: "supply",
    rest: ["reindex"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("banq -p P000 -M borrow [reindex, XYZT]", OPTS, () => {
  const args = {
    pool: "P000",
    mode: "borrow",
    rest: ["reindex", "XYZT"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: XYZT",
  );
});
Deno.test("banq -p P999 -M supply [reindex, APOW]", OPTS, () => {
  const args = {
    pool: "P999",
    mode: "supply",
    rest: ["reindex", "APOW"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid pool: P999",
  );
});
Deno.test("banq -p P000 [reindex, AVAX]", OPTS, () => {
  const args = {
    pool: "P000",
    rest: ["reindex", "AVAX"],
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid mode: undefined",
  );
});
