import "../function/as-bigint.ts";
import { as_bigint } from "../function/as-bigint.ts";
import { cache_by } from "./cache-by.ts";

/**
 * @returns address associated with given env-prefix
 */
export function address_by(
  env_prefix: string,
  env_suffix: string,
): bigint | undefined {
  const value = Deno.env.get(`${env_prefix}_ADDRESS_${env_suffix}`);
  if (value !== undefined) return as_bigint(value);
}
/**
 * @returns prefix associated with given env-address
 */
export function prefix_by(
  env_address: bigint,
): string | undefined {
  const key = key_by(env_address);
  if (key !== undefined) {
    return key.split("_")[0];
  }
}
/**
 * @returns suffix associated with given env-address
 */
export function suffix_by(
  env_address: bigint,
): string | undefined {
  const key = key_by(env_address);
  if (key !== undefined) {
    const parts = key.split("_");
    return parts[parts.length - 1];
  }
}
/**
 * @returns the environment key associated with given env-address
 */
function key_by(env_address: bigint): string | undefined {
  return cache_by(ADDRESS_RX).get(env_address);
}
const ADDRESS_RX = /_ADDRESS$|_ADDRESS_(v[0-9]+[a-z])$/;
