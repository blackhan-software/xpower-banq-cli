import { assertEquals, assertRejects } from "@std/assert";
import { ArgumentError } from "../../arg/types.ts";
import { type BanqArgs, cli_next } from "./banq.ts";

Deno.test("banq []", async () => {
  const args = { rest: [] as string[] } as BanqArgs;
  const next = await cli_next(args);
  assertEquals(next.value, undefined);
});
Deno.test("banq [xyz]", () => {
  const args = { rest: ["xyz"] } as BanqArgs;
  assertRejects(
    () => cli_next(args),
    ArgumentError,
    "unknown command: xyz",
  );
});
