import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type CalcArgs, cli_next } from "../../cli/calc/calc.ts";

/**
 * @group positive tests
 */
Deno.test("calc [add, 1, 2]", async () => {
  const args = { rest: ["add", 1, 2] };
  const call = ["add", [1, 2], [3]];
  const next = await cli_next(args as CalcArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests
 */
Deno.test("calc [add]", () => {
  const args = { rest: ["add"] };
  assertRejects(
    () => cli_next(args as CalcArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("calc [add, 1]", () => {
  const args = { rest: ["add", 1] };
  assertRejects(
    () => cli_next(args as CalcArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("calc [add, x, y]", () => {
  const args = { rest: ["add", "x", "y"] };
  assertRejects(
    () => cli_next(args as CalcArgs),
    ArgumentError,
    "invalid number: x",
  );
});
