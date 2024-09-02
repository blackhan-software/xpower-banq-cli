import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type CalcArgs, cli_next } from "../../cli/calc/calc.ts";

/**
 * @group positive tests
 */
Deno.test("calc [mul, 1, 2]", async () => {
  const args = { rest: ["mul", 1, 2] };
  const call = ["mul", [1, 2], [2]];
  const next = await cli_next(args as CalcArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests
 */
Deno.test("calc [mul]", () => {
  const args = { rest: ["mul"] };
  assertRejects(
    () => cli_next(args as CalcArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("calc [mul, 1]", () => {
  const args = { rest: ["mul", 1] };
  assertRejects(
    () => cli_next(args as CalcArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("calc [mul, x, y]", () => {
  const args = { rest: ["mul", "x", "y"] };
  assertRejects(
    () => cli_next(args as CalcArgs),
    ArgumentError,
    "invalid number: x",
  );
});
