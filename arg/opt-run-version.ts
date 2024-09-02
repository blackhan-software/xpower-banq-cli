import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError, type RunVersion } from "./types.ts";

export function opt_run_version(
  args?: Partial<Pick<BanqArgs, "run_version">>,
): {
  run_version: RunVersion;
} {
  const arg = args?.run_version ?? Deno.env.get("RUN_VERSION");
  if (typeof arg === "string") {
    const run_version = arg.toLowerCase();
    if (run_version === "v10a") {
      return { run_version };
    }
    if (run_version === "v10b") {
      return { run_version };
    }
  }
  throw new ArgumentError(`invalid run-version: ${arg}`);
}
