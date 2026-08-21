import type { Config } from "./types.ts";

/**
 * Flatten a typed {@link Config} back into the legacy dotenv key space
 * consumed by `Deno.env` readers (`address_by`, `registry.ts`, `cache_by`,
 * `arg/opt-*.ts`). This is the single canonical inverse of the YAML schema.
 */
export function flatten(config: Config): Record<string, string> {
  const env: Record<string, string> = {};
  if (config.provider.urls.length > 0) {
    env.PROVIDER_URL = config.provider.urls.join(",");
  }
  if (config.contract_run !== undefined) {
    env.CONTRACT_RUN = config.contract_run;
  }
  if (config.accounts?.private_key !== undefined) {
    env.PRIVATE_KEY = config.accounts.private_key;
  }
  if (config.accounts?.hd_path !== undefined) {
    env.HD_PATH = config.accounts.hd_path;
  }
  for (const [run, addr] of Object.entries(config.contracts.caps)) {
    env[`CAPS_ADDRESS_${run}`] = addr;
  }
  for (const [name, runs] of Object.entries(config.contracts.pool_caps)) {
    for (const [run, addr] of Object.entries(runs)) {
      env[`${name}_CAPS_ADDRESS_${run}`] = addr;
    }
  }
  for (const [name, runs] of Object.entries(config.contracts.pools)) {
    for (const [run, addr] of Object.entries(runs)) {
      env[`${name}_ADDRESS_${run}`] = addr;
    }
  }
  for (const [role, addr] of Object.entries(config.contacts ?? {})) {
    env[`${role}_ADDRESS`] = addr;
  }
  return env;
}
