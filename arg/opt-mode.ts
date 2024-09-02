import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError, type Mode } from "./types.ts";

export function opt_mode(
  args?: Partial<Pick<BanqArgs, "mode">>,
): {
  mode: Mode;
} {
  const arg = args?.mode;
  if (typeof arg === "string") {
    const mode = arg.toLowerCase();
    if (mode === "supply") {
      return { mode };
    }
    if (mode === "borrow") {
      return { mode };
    }
  }
  throw new ArgumentError(`invalid mode: ${arg}`);
}
