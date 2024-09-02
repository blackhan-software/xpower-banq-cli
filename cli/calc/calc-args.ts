import { hex2bigint, suffix_n } from "../../arg/parser.ts";
import { parseArgs } from "../../function/parse-args.ts";

const CLI_OPTIONS = {
  boolean: [
    "version",
    "help",
  ],
  alias: {
    help: "h",
    version: "v",
  },
};

/**
 * Parse CLI arguments: hex-literals are treated as bigints.
 */
export function parse(strings: string[]) {
  const { _, ...argv } = parseArgs(suffix_n(strings), CLI_OPTIONS);
  return Object.assign(argv, { rest: hex2bigint(_) }); // _ => rest
}

export type CalcArgs = ReturnType<typeof parse>;
