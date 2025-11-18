import {
  ArgumentError,
  type CommandResult,
  type Result,
} from "../../cmd/types.ts";

import { Spinner } from "../../etc/cli-spinner.ts";
import pkg from "../../package.json" with { type: "json" };
import type { Command } from "./banq-types.ts";
import { type BanqArgs, cli_banq, parse } from "./banq.ts";

if (import.meta.main) {
  const args = parse(Deno.args);
  if (args.list_commands) {
    if (args.rest.length === 0) {
      console.log([
        "supply",
        "su",
        "borrow",
        "bo",
        "settle",
        "se",
        "redeem",
        "re",
        "liquidate",
        "li",
        "refresh",
        "rf",
        "retwap",
        "rt",
        "reindex",
        "ri",
        "health-of",
        "ho",
        "rates-of",
        "ro",
      ].join(" "));
      console.log([
        "xpow-init",
        "xi",
        "xpow-mine",
        "xm",
        "xpow-mint",
        "xt",
      ].join(" "));
      console.log([
        "apow-claim-batch",
        "acb",
        "apow-claim",
        "ac",
      ].join(" "));
    }
    Deno.exit(0);
  }
  if (args.list_options) {
    if (args.rest.length === 0) {
      console.log([
        "--version",
        "-v",
        "--help",
        "-h",
      ].join(" "));
      Deno.exit(0);
    }
  }
  if (args.version) {
    console.log(`banq v${pkg.version}`);
    Deno.exit(0);
  }
  if (args.help || args.rest.length === 0) {
    const help = await import("./banq-help.ts");
    help.default(args);
    Deno.exit(0);
  }
  const spinner = !args.no_progress ? new Spinner() : null;
  spinner?.start();
  try {
    for await (const item of cli_banq(args)) {
      spinner?.stop(true);
      console_log(item, args);
      spinner?.start();
    }
  } catch (e) {
    if (e instanceof ArgumentError) {
      console.error(e.message);
      Deno.exit(1);
    }
    throw e;
  } finally {
    spinner?.stop(true);
  }
}
function console_log(
  [cmd, cmd_args, results]: [Command, ...CommandResult],
  args: BanqArgs,
) {
  const sep = cmd_args.length > 0 ? " " : "";
  for (const result of results) {
    if (args.json) {
      console.log(json(result));
    } else {
      const cmd_text = `${cmd}${sep}${cmd_args.join(" ")}`;
      console.log(`${cmd_text} ${text(result)}`);
    }
  }
}
function json(result: Result) {
  if (result) {
    return `[${typeof result === "string" ? result : '"OK"'}]`;
  }
  return '["!!"]';
}
function text(result: Result) {
  if (result) {
    return `[${typeof result === "string" ? result : "OK"}]`;
  }
  return "[!!]";
}
