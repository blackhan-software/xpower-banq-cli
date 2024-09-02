import { address_by } from "../env/find-by.ts";
import { opt_contract_run } from "./opt-contract-run.ts";

/**
 * Resolve the caps address for the active contract-run, optionally scoped to
 * a pool (`{POOL}_CAPS` override first, falling back to the shared `CAPS`).
 */
export function opt_caps(pool?: string): { address: bigint } {
  const { contract_run } = opt_contract_run();
  const address =
    (pool !== undefined
      ? address_by(`${pool}_CAPS`, contract_run)
      : undefined) ?? address_by("CAPS", contract_run);
  if (address === undefined) {
    throw new Error("CAPS_ADDRESS not set");
  }
  return { address };
}
