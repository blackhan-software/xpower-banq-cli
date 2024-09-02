import { type Argument, ArgumentError } from "./types.ts";

export function arg_amount(
  rest: Argument[],
  fallback?: number,
): number {
  const arg = rest.shift() ?? fallback;
  if (typeof arg === "undefined") {
    throw new ArgumentError("insufficient arguments");
  }
  if (typeof arg !== "number" || arg < 0) {
    throw new ArgumentError(`invalid amount: ${arg}`);
  }
  return arg;
}
