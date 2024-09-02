import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type CalcArgs, cli_next } from "../../cli/calc/calc.ts";

/**
 * @group positive tests
 */
Deno.test("calc [div, 1, 2]", async () => {
  const args = { rest: ["div", 1, 2] };
  const call = ["div", [1, 2], [0.5]];
  const next = await cli_next(args as CalcArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests
 */
Deno.test("calc [div]", () => {
  const args = { rest: ["div"] };
  assertRejects(
    () => cli_next(args as CalcArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("calc [div, 1]", () => {
  const args = { rest: ["div", 1] };
  assertRejects(
    () => cli_next(args as CalcArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("calc [div, x, y]", () => {
  const args = { rest: ["div", "x", "y"] };
  assertRejects(
    () => cli_next(args as CalcArgs),
    ArgumentError,
    "invalid number: x",
  );
});
