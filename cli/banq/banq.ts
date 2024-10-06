import { type Argument, ArgumentError } from "../../arg/types.ts";
import type { Result } from "../../cmd/types.ts";
import type { BanqArgs } from "./banq-args.ts";
export type { BanqArgs };
import { parse } from "./banq-args.ts";
export { parse };

import { command as borrow } from "../../cmd/banq/borrow-tokens.ts";
import { command as liquidate } from "../../cmd/banq/liquidate-user.ts";
import { command as pass } from "../../cmd/banq/pass-arguments.ts";
import { command as redeem } from "../../cmd/banq/redeem-tokens.ts";
import { command as refresh } from "../../cmd/banq/refresh-oracle.ts";
import { command as retwap } from "../../cmd/banq/retwap-oracle.ts";
import { command as settle } from "../../cmd/banq/settle-tokens.ts";
import { command as supply } from "../../cmd/banq/supply-tokens.ts";
import { command as health_of } from "../../cmd/banq/health-of-user.ts";
import { command as rates_of } from "../../cmd/banq/rates-of-token.ts";
import type { Command } from "./banq-types.ts";

export function cli_next(args: BanqArgs): Promise<
  IteratorResult<[Command, Argument[], Result[]]>
> {
  return cli_banq(args).next();
}
export async function* cli_banq(args: BanqArgs): AsyncGenerator<
  [Command, Argument[], Result[]]
> {
  while (true) {
    const cmd = args.rest.shift();
    if (cmd === undefined) {
      return;
    }
    if (cmd === "pa" || cmd === "pass") {
      yield ["pass", ...pass(args)];
      continue;
    }
    if (cmd === "su" || cmd === "supply") {
      yield ["supply", ...await supply(args)];
      continue;
    }
    if (cmd === "bo" || cmd === "borrow") {
      yield ["borrow", ...await borrow(args)];
      continue;
    }
    if (cmd === "se" || cmd === "settle") {
      yield ["settle", ...await settle(args)];
      continue;
    }
    if (cmd === "re" || cmd === "redeem") {
      yield ["redeem", ...await redeem(args)];
      continue;
    }
    if (cmd === "li" || cmd === "liquidate") {
      yield ["liquidate", ...await liquidate(args)];
      continue;
    }
    if (cmd === "rf" || cmd === "refresh") {
      yield ["refresh", ...await refresh(args)];
      continue;
    }
    if (cmd === "rt" || cmd === "retwap") {
      yield ["retwap", ...await retwap(args)];
      continue;
    }
    if (cmd === "ho" || cmd === "health-of") {
      yield ["health-of", ...await health_of(args)];
      continue;
    }
    if (cmd === "ro" || cmd === "rates-of") {
      yield ["rates-of", ...await rates_of(args)];
      continue;
    }
    throw new ArgumentError(`unknown command: ${cmd}`);
  }
}
