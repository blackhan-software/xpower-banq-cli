import {
  ArgumentError,
  type CommandResult,
  type Result,
} from "../../cmd/types.ts";
import type { Command } from "./calc-types.ts";
import { cli_calc, parse } from "./calc.ts";

if (import.meta.main) {
  const args = parse(Deno.args);
  if (args.version) {
    console.log("calc 1.0.0");
    Deno.exit(0);
  }
  if (args.help || args.rest.length === 0) {
    console.log(
      "Usage: calc <command> <argument(s)>",
    );
    Deno.exit(0);
  }
  try {
    for await (const item of cli_calc(args)) {
      console_log(item);
    }
  } catch (e) {
    if (e instanceof ArgumentError) {
      console.error(e.message);
      Deno.exit(1);
    }
    throw e;
  }
}
function console_log(
  [cmd, cmd_args, results]: [Command, ...CommandResult],
) {
  const sep = cmd_args.length > 0 ? " " : "";
  for (const result of results) {
    console.log(
      `${cmd}${sep}${cmd_args.join(" ")} = ${repr(result)}`,
    );
  }
}
function repr(result: Result) {
  return `${result}`;
}
