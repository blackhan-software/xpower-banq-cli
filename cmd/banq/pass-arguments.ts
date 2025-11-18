import { arg_rest } from "../../arg/arg-rest.ts";
import type { BanqArgs } from "../../cli/banq/banq.ts";
import type { CommandResult } from "../types.ts";

/**
 * pass [--options]
 */
export function command(args: BanqArgs): CommandResult {
  if (args.list_options) {
    console.log([
      "--help",
      "-h",
      "--version",
      "-v",
    ].join(" "));
    Deno.exit(0);
  }
  const rest = [...arg_rest(args.rest)];
  return [rest, [true]];
}
