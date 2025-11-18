import { hex2bigint, suffix_n, underscore } from "../../arg/parser.ts";
import type { Mode, RunVersion } from "../../arg/types.ts";
import { parseArgs } from "../../function/parse-args.ts";

const CLI_OPTIONS = {
  default: {
    "at": undefined as number | string | undefined,
    "broadcast": false,
    "digits": undefined as number | undefined,
    "gas_limit": undefined as bigint | number | string | undefined,
    "hd_path": undefined as string | undefined,
    "help": false,
    "json": false,
    "ledger": false,
    "max_fee_per_gas": undefined as bigint | number | string | undefined,
    "max_priority_fee_per_gas": undefined as
      | number
      | bigint
      | string
      | undefined,
    "mode": undefined as Mode | undefined,
    "model": false,
    "nft_id": undefined as number | string | undefined,
    "nonce_length": undefined as number | undefined,
    "no_progress": false,
    "oracle": undefined as bigint | string | undefined,
    "page": undefined as number | string | undefined,
    "page_size": undefined as number | string | undefined,
    "page_step": undefined as number | string | undefined,
    "hist_size": undefined as number | string | undefined,
    "percent": undefined as number | undefined,
    "percent_min": undefined as number | undefined,
    "percent_max": undefined as number | undefined,
    "plot": undefined as boolean | string | undefined,
    "pool": undefined as bigint | string | undefined,
    "pow_level": undefined as number | undefined,
    "private_key": undefined as string | undefined,
    "provider_url": undefined as string | undefined,
    "contract_run": undefined as RunVersion | undefined,
    "to": undefined as bigint | string | undefined,
    "timeout": undefined as number | undefined,
    "watch": undefined as string | undefined,
  },
  boolean: [
    "list_commands",
    "list_options",
    "broadcast",
    "cli_version",
    "help",
    "json",
    "ledger",
    "model",
    "no_progress",
  ],
  string: [
    "hd_path",
    "oracle",
    "private_key",
    "provider_url",
    "to",
    "watch",
  ],
  alias: {
    "at": "@",
    "broadcast": "Y",
    "cli_version": "v",
    "digits": "d",
    "gas_limit": "G",
    "hd_path": "H",
    "help": "h",
    "json": "j",
    "ledger": "l",
    "max_fee_per_gas": "f",
    "max_priority_fee_per_gas": "F",
    "mode": "M",
    "model": "m",
    "no_progress": "P",
    "oracle": "o",
    "page": "#",
    "page_size": "z",
    "page_step": "s",
    "percent": "%",
    "percent_min": "L",
    "percent_max": "R",
    "plot": "g",
    "pool": "p",
    "private_key": "k",
    "hist_size": "Z",
    "provider_url": "u",
    "timeout": "T",
    "contract_run": "V",
    "watch": "w",
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
