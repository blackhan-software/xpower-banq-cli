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
Deno.test("banq [apow-claim-batch, APOW, 202500, 202503]", OPTS, async () => {
  const args = {
    rest: ["apow-claim-batch", "APOW"],
    nft_id: "202500,202503",
    to: UNUS,
  };
  const call = ["apow-claim-batch", ["APOW", 202500, 202503, UNUS], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
Deno.test("banq [apow-claim-batch, 202500, 202503]", OPTS, async () => {
  const args = {
    rest: ["apow-claim-batch"],
    nft_id: "202500,202503",
    to: UNUS,
  };
  const call = ["apow-claim-batch", ["APOW", 202500, 202503, UNUS], [false]];
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests
 */
Deno.test("banq [apow-claim-batch, ABCD, 202500, 202503]", OPTS, () => {
  const args = {
    rest: ["apow-claim-batch", "ABCD"],
    nft_id: "202500,202503",
    to: UNUS,
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid token: ABCD",
  );
});
Deno.test("banq [apow-claim-batch, APOW]", OPTS, () => {
  const args = {
    rest: ["apow-claim-batch", "APOW"],
    to: UNUS,
  };
  assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "invalid nft-id: undefined",
  );
});
