import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";

const UNUS = "0x0000000000000000000000000000000000000001";
const OPTS = {
  permissions: { env: true },
};
/**
 * @group positive tests
 */
Deno.test("banq [apow-claim, APOW, 202500]", OPTS, async () => {
  const args = {
    rest: ["apow-claim", "APOW"],
    nft_id: "202500",
    to: UNUS,
  };
  const call = ["apow-claim", ["APOW", 202500, UNUS], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test("banq [apow-claim, 202500]", OPTS, async () => {
  const args = {
    rest: ["apow-claim"],
    nft_id: "202500",
    to: UNUS,
  };
  const call = ["apow-claim", ["APOW", 202500, UNUS], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests
 */
Deno.test("banq [apow-claim, ABCD, 202500]", OPTS, () => {
  const args = {
    rest: ["apow-claim", "ABCD"],
    nft_id: "202500",
    to: UNUS,
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: ABCD",
  );
});
Deno.test("banq [apow-claim, APOW]", OPTS, () => {
  const args = {
    rest: ["apow-claim", "APOW"],
    to: UNUS,
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid nft-id: undefined",
  );
});
