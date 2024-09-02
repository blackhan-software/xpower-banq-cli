import { arg_numbers } from "../../arg/arg-number.ts";
import type { CalcArgs } from "../../cli/calc/calc.ts";
import type { CommandResult } from "../types.ts";

export function command(args: CalcArgs): CommandResult {
  const [lhs, rhs] = [...arg_numbers(args.rest, 2)];
  return [[lhs, rhs], [add(lhs, rhs)]];
}
function add(a: number, b: number): number {
  return a + b;
}
