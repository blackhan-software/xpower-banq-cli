import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type CalcArgs, cli_next } from "../../cli/calc/calc.ts";

/**
 * @group positive tests
 */
Deno.test("calc [sub, 1, 2]", async () => {
  const args = { rest: ["sub", 1, 2] };
  const call = ["sub", [1, 2], [-1]];
  const next = await cli_next(args as CalcArgs);
  assertEquals(next.value, call);
});
/**
 * @group negative tests
 */
Deno.test("calc [sub]", () => {
  const args = { rest: ["sub"] };
  assertRejects(
    () => cli_next(args as CalcArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("calc [sub, 1]", () => {
  const args = { rest: ["sub", 1] };
  assertRejects(
    () => cli_next(args as CalcArgs),
    ArgumentError,
    "insufficient arguments",
  );
});
Deno.test("calc [sub, x, y]", () => {
  const args = { rest: ["sub", "x", "y"] };
  assertRejects(
    () => cli_next(args as CalcArgs),
    ArgumentError,
    "invalid number: x",
  );
});
