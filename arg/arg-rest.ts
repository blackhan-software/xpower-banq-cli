import type { Argument } from "./types.ts";

export function* arg_rest(
  rest: Argument[],
) {
  while (rest.length > 0) {
    const arg = rest.shift();
    if (arg !== undefined) {
      yield arg;
    }
  }
}
