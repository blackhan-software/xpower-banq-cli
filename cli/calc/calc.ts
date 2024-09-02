import { type Argument, ArgumentError } from "../../arg/types.ts";
import type { Result } from "../../cmd/types.ts";
import type { CalcArgs } from "./calc-args.ts";
export type { CalcArgs };
import { parse } from "./calc-args.ts";
export { parse };

import type { Command } from "./calc-types.ts";
import { command as add } from "../../cmd/calc/add-numbers.ts";
import { command as sub } from "../../cmd/calc/sub-numbers.ts";
import { command as mul } from "../../cmd/calc/mul-numbers.ts";
import { command as div } from "../../cmd/calc/div-numbers.ts";

export function cli_next(args: CalcArgs): Promise<
  IteratorResult<[Command, Argument[], Result[]]>
> {
  return cli_calc(args).next();
}
export async function* cli_calc(args: CalcArgs): AsyncGenerator<
  [Command, Argument[], Result[]]
> {
  while (true) {
    const cmd = args.rest.shift();
    if (cmd === undefined) {
      return;
    }
    if (cmd === "a" || cmd === "add") {
      yield ["add", ...add(args)];
      continue;
    }
    if (cmd === "s" || cmd === "sub") {
      yield ["sub", ...sub(args)];
      continue;
    }
    if (cmd === "m" || cmd === "mul") {
      yield ["mul", ...mul(args)];
      continue;
    }
    if (cmd === "d" || cmd === "div") {
      yield ["div", ...div(args)];
      continue;
    }
    throw new ArgumentError(`unknown command: ${cmd}`);
  }
}
