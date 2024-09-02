import { address_by } from "../env/find-by.ts";
import { opt_contract_run } from "./opt-contract-run.ts";

export function opt_caps(): { address: bigint } {
  const { contract_run } = opt_contract_run();
  const address = address_by("CAPS", contract_run);
  if (address === undefined) {
    throw new Error("CAPS_ADDRESS not set");
  }
  return { address };
}
