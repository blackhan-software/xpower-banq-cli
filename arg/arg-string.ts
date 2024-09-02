import { type Argument, ArgumentError } from "./types.ts";

export function arg_string(
  rest: Argument[],
  fallback?: string,
): string {
  const arg = rest.shift() ?? fallback;
  if (typeof arg === "undefined") {
    throw new ArgumentError("insufficient arguments");
  }
  if (typeof arg !== "string") {
    throw new ArgumentError(`invalid string: ${arg}`);
  }
  return arg;
}
export function* arg_strings(
  rest: Argument[],
  length?: number,
) {
  if (length === undefined) {
    length = rest.length;
  }
  for (let i = 0; i < length; i++) {
    yield arg_string(rest);
  }
}
