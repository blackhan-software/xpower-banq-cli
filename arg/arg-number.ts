import { type Argument, ArgumentError } from "./types.ts";

export function arg_number(
  rest: Argument[],
  fallback?: number,
): number {
  const arg = rest.shift() ?? fallback;
  if (typeof arg === "undefined") {
    throw new ArgumentError("insufficient arguments");
  }
  if (typeof arg !== "number") {
    throw new ArgumentError(`invalid number: ${arg}`);
  }
  return arg;
}
export function* arg_numbers(
  rest: Argument[],
  length?: number,
) {
  if (length === undefined) {
    length = rest.length;
  }
  for (let i = 0; i < length; i++) {
    yield arg_number(rest);
  }
}
