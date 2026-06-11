import { assertEquals } from "@std/assert";
import { type BanqArgs, cli_next } from "../../cli/banq/banq.ts";

/**
 * @group positive tests
 */
Deno.test("banq [pass]", async () => {
  const args = { rest: ["pass"] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["pass", [], [true]]);
});
Deno.test("banq [pass, 1]", async () => {
  const args = { rest: ["pass", 1] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["pass", [1], [true]]);
});
Deno.test("banq [pass, 1, 2]", async () => {
  const args = { rest: ["pass", 1, 2] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["pass", [1, 2], [true]]);
});
Deno.test("banq [pass, 1, 2, 3]", async () => {
  const args = { rest: ["pass", 1, 2, 3] };
  const next = await cli_next(args as BanqArgs);
  assertEquals(next.value, ["pass", [1, 2, 3], [true]]);
});
