import type { Argument } from "../arg/types.ts";
export type { Argument };
import { ArgumentError } from "../arg/types.ts";
export { ArgumentError };

export type CommandResult = [Argument[], Result[]];
export type Result = Argument | null;
