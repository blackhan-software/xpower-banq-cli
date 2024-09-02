import type { BanqArgs } from "../cli/banq/banq.ts";
import { ArgumentError, type RunVersion } from "./types.ts";

export function opt_contract_run(
  args?: Partial<Pick<BanqArgs, "contract_run">>,
): {
  contract_run: RunVersion;
} {
  const arg = args?.contract_run ?? Deno.env.get("CONTRACT_RUN");
  if (typeof arg === "string") {
    const contract_run = arg.toLowerCase();
    if (contract_run === "v10a") {
      return { contract_run };
    }
    if (contract_run === "v10b") {
      return { contract_run };
    }
  }
  throw new ArgumentError(`invalid contract-run: ${arg}`);
}
