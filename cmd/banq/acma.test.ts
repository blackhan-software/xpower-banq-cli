import { assertEquals } from "@std/assert";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";

const OPTS = {
  permissions: { env: true },
};
/**
 * @group positive tests — dry-run default (show)
 */
Deno.test("banq [acma]", OPTS, async () => {
  const args = { rest: ["acma"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["acma", ["show"], [false]]);
});
/**
 * @group positive tests — dry-run show
 */
Deno.test("banq [acma, show]", OPTS, async () => {
  const args = { rest: ["acma", "show"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["acma", ["show"], [false]]);
});
/**
 * @group positive tests — dry-run roles
 */
Deno.test("banq [acma, roles]", OPTS, async () => {
  const args = { rest: ["acma", "roles"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["acma", ["roles"], [false]]);
});
/**
 * @group positive tests — dry-run members
 */
Deno.test("banq [acma, members]", OPTS, async () => {
  const args = { rest: ["acma", "members"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["acma", ["members"], [false]]);
});
/**
 * @group positive tests — dry-run targets
 */
Deno.test("banq [acma, targets]", OPTS, async () => {
  const args = { rest: ["acma", "targets"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["acma", ["targets"], [false]]);
});
/**
 * @group positive tests — dry-run hierarchy
 */
Deno.test("banq [acma, hierarchy]", OPTS, async () => {
  const args = { rest: ["acma", "hierarchy"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["acma", ["hierarchy"], [false]]);
});
/**
 * @group positive tests — dry-run delays
 */
Deno.test("banq [acma, delays]", OPTS, async () => {
  const args = { rest: ["acma", "delays"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["acma", ["delays"], [false]]);
});
/**
 * @group positive tests — dry-run logs
 */
Deno.test("banq [acma, logs]", OPTS, async () => {
  const args = { rest: ["acma", "logs"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["acma", ["logs"], [false]]);
});
/**
 * @group positive tests — dry-run json flag
 */
Deno.test("banq --json [acma]", OPTS, async () => {
  const args = { json: true, rest: ["acma"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["acma", ["show"], [false]]);
});
