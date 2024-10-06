import { parseArgs } from "@std/cli/parse-args";
import { hex2bigint, suffix_n, underscore } from "../../arg/parser.ts";

const CLI_OPTIONS = {
  default: {
    "at": undefined as number | string | undefined,
    "broadcast": false,
    "digits": undefined as number | undefined,
    "hd_path": undefined as string | undefined,
    "help": false,
    "json": false,
    "ledger": false,
    "model": false,
    "no_progress": false,
    "oracle": undefined as string | bigint | undefined,
    "page": undefined as number | string | undefined,
    "page_size": undefined as number | string | undefined,
    "page_step": undefined as number | string | undefined,
    "percent": undefined as number | undefined,
    "plot": undefined as boolean | string | undefined,
    "pool": undefined as number | bigint | undefined,
    "private_key": undefined as string | undefined,
    "provider_url": undefined as string | undefined,
  },
  boolean: [
    "list_commands",
    "list_options",
    "broadcast",
    "help",
    "json",
    "ledger",
    "model",
    "no_progress",
    "version",
  ],
  string: [
    "hd_path",
    "oracle",
    "private_key",
    "provider_url",
  ],
  alias: {
    "at": "@",
    "broadcast": "Y",
    "digits": "d",
    "hd_path": "H",
    "help": "h",
    "json": "j",
    "ledger": "l",
    "model": "m",
    "no_progress": "P",
    "oracle": "o",
    "page": "#",
    "page_size": "z",
    "page_step": "s",
    "percent": "%",
    "plot": "g",
    "pool": "p",
    "private_key": "k",
    "provider_url": "u",
    "version": "v",
  },
};

/**
 * Parse CLI arguments: hex-literals are treated as bigints.
 */
export function parse(strings: string[]) {
  const { _, ...argv } = parseArgs(suffix_n(strings), CLI_OPTIONS);
  return Object.assign(underscore(argv, CLI_OPTIONS.alias), {
    rest: hex2bigint(_),
  });
}
export type BanqArgs = ReturnType<typeof parse>;
