import { arg_rest } from "../../arg/arg-rest.ts";
import type { BanqArgs } from "../../cli/banq/banq.ts";
import { BROADCAST, type CommandResult } from "../types.ts";
import { list_common_options } from "./tool/completions.ts";

/**
 * pass [--options]
 */
export function command(args: BanqArgs): CommandResult {
  if (args.list_options) {
    list_common_options();
  }
  const rest = [...arg_rest(args.rest)];
  return [rest, [BROADCAST]];
}
