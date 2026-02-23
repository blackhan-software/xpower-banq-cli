import { type Argument, ArgumentError } from "../../arg/types.ts";
import type { Result } from "../../cmd/types.ts";
import type { BanqArgs } from "./banq-args.ts";
import { parse } from "./banq-args.ts";
export type { BanqArgs };
export { parse };

import type { Command } from "./banq-types.ts";

type CommandFn = (args: BanqArgs) =>
  | Promise<[Argument[], Result[]]>
  | [Argument[], Result[]];

type LazyCommandFn = () => Promise<{
  command: CommandFn;
}>;

// deno-fmt-ignore
const COMMANDS = new Map<string, [Command, LazyCommandFn]>([
  ["pa",               ["pass",              () => import("../../cmd/banq/pass-arguments.ts")]],
  ["pass",             ["pass",              () => import("../../cmd/banq/pass-arguments.ts")]],
  ["su",               ["supply",            () => import("../../cmd/banq/supply-tokens.ts")]],
  ["supply",           ["supply",            () => import("../../cmd/banq/supply-tokens.ts")]],
  ["bo",               ["borrow",            () => import("../../cmd/banq/borrow-tokens.ts")]],
  ["borrow",           ["borrow",            () => import("../../cmd/banq/borrow-tokens.ts")]],
  ["se",               ["settle",            () => import("../../cmd/banq/settle-tokens.ts")]],
  ["settle",           ["settle",            () => import("../../cmd/banq/settle-tokens.ts")]],
  ["re",               ["redeem",            () => import("../../cmd/banq/redeem-tokens.ts")]],
  ["redeem",           ["redeem",            () => import("../../cmd/banq/redeem-tokens.ts")]],
  ["li",               ["liquidate",         () => import("../../cmd/banq/liquidate-user.ts")]],
  ["liquidate",        ["liquidate",         () => import("../../cmd/banq/liquidate-user.ts")]],
  ["rf",               ["refresh",           () => import("../../cmd/banq/refresh-oracle.ts")]],
  ["refresh",          ["refresh",           () => import("../../cmd/banq/refresh-oracle.ts")]],
  ["rt",               ["retwap",            () => import("../../cmd/banq/retwap-oracle.ts")]],
  ["retwap",           ["retwap",            () => import("../../cmd/banq/retwap-oracle.ts")]],
  ["ri",               ["reindex",           () => import("../../cmd/banq/reindex-tokens.ts")]],
  ["reindex",          ["reindex",           () => import("../../cmd/banq/reindex-tokens.ts")]],
  ["ho",               ["health-of",         () => import("../../cmd/banq/health-of-user.ts")]],
  ["health-of",        ["health-of",         () => import("../../cmd/banq/health-of-user.ts")]],
  ["ro",               ["rates-of",          () => import("../../cmd/banq/rates-of-token.ts")]],
  ["rates-of",         ["rates-of",          () => import("../../cmd/banq/rates-of-token.ts")]],
  ["xi",               ["xpow-init",         () => import("../../cmd/banq/xpow-init.ts")]],
  ["xpow-init",        ["xpow-init",         () => import("../../cmd/banq/xpow-init.ts")]],
  ["xm",               ["xpow-mine",         () => import("../../cmd/banq/xpow-mine.ts")]],
  ["xpow-mine",        ["xpow-mine",         () => import("../../cmd/banq/xpow-mine.ts")]],
  ["xt",               ["xpow-mint",         () => import("../../cmd/banq/xpow-mint.ts")]],
  ["xpow-mint",        ["xpow-mint",         () => import("../../cmd/banq/xpow-mint.ts")]],
  ["ac",               ["apow-claim",        () => import("../../cmd/banq/apow-claim.ts")]],
  ["apow-claim",       ["apow-claim",        () => import("../../cmd/banq/apow-claim.ts")]],
  ["acb",              ["apow-claim-batch",  () => import("../../cmd/banq/apow-claim-batch.ts")]],
  ["apow-claim-batch", ["apow-claim-batch",  () => import("../../cmd/banq/apow-claim-batch.ts")]],
  ["acma",             ["acma",              () => import("../../cmd/banq/acma.ts")]],
]);

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
    const entry = COMMANDS.get(cmd as string);
    if (!entry) {
      throw new ArgumentError(`unknown command: ${cmd}`);
    }
    const [name, loader] = entry;
    const { command: handler } = await loader();
    yield [name, ...await handler(args)];
  }
}
