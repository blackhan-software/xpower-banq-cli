import { assertEquals, assertRejects } from "@std/assert";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";
import { ArgumentError } from "../../arg/types.ts";

const OPTS = {
  permissions: { env: true },
};
/**
 * @group positive tests — dry-run default (show)
 */
Deno.test("banq [acma, pool=P000]", OPTS, async () => {
  const args = { pool: "P000", rest: ["acma"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["acma", ["show"], [false]]);
});
/**
 * @group positive tests — dry-run show
 */
Deno.test("banq [acma, show, pool=P000]", OPTS, async () => {
  const args = { pool: "P000", rest: ["acma", "show"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["acma", ["show"], [false]]);
});
/**
 * @group positive tests — dry-run roles
 */
Deno.test("banq [acma, roles, pool=P000]", OPTS, async () => {
  const args = { pool: "P000", rest: ["acma", "roles"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["acma", ["roles"], [false]]);
});
/**
 * @group positive tests — dry-run members
 */
Deno.test("banq [acma, members, pool=P000]", OPTS, async () => {
  const args = { pool: "P000", rest: ["acma", "members"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["acma", ["members"], [false]]);
});
/**
 * @group positive tests — dry-run targets
 */
Deno.test("banq [acma, targets, pool=P000]", OPTS, async () => {
  const args = { pool: "P000", rest: ["acma", "targets"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["acma", ["targets"], [false]]);
});
/**
 * @group positive tests — dry-run hierarchy
 */
Deno.test("banq [acma, hierarchy, pool=P000]", OPTS, async () => {
  const args = { pool: "P000", rest: ["acma", "hierarchy"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["acma", ["hierarchy"], [false]]);
});
/**
 * @group positive tests — dry-run delays
 */
Deno.test("banq [acma, delays, pool=P000]", OPTS, async () => {
  const args = { pool: "P000", rest: ["acma", "delays"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["acma", ["delays"], [false]]);
});
/**
 * @group positive tests — dry-run logs
 */
Deno.test("banq [acma, logs, pool=P000]", OPTS, async () => {
  const args = { pool: "P000", rest: ["acma", "logs"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["acma", ["logs"], [false]]);
});
/**
 * @group positive tests — dry-run json flag
 */
Deno.test("banq --json [acma, pool=P000]", OPTS, async () => {
  const args = { json: true, pool: "P000", rest: ["acma"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["acma", ["show"], [false]]);
});
/**
 * @group negative tests — requires --pool or --acma
 */
Deno.test("banq [acma] requires --pool or --acma", OPTS, async () => {
  const args = { rest: ["acma"] };
  await assertRejects(
    () => cli_next(args as BanqArgs),
    ArgumentError,
    "acma: --pool is required",
  );
});
