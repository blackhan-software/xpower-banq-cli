import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type CalcArgs, cli_next } from "./calc.ts";

Deno.test("calc []", async () => {
  const args = { rest: [] as string[] } as CalcArgs;
  const next = await cli_next(args);
  assertEquals(next.value, undefined);
});
Deno.test("calc [xyz]", () => {
  const args = { rest: ["xyz"] } as CalcArgs;
  assertRejects(
    () => cli_next(args),
    ArgumentError,
    "unknown command: xyz",
  );
});
