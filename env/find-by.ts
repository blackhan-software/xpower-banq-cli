import "../function/as-bigint.ts";
import { as_bigint } from "../function/as-bigint.ts";

/**
 * @returns address associated with the given env-prefix
 */
export function address_by(
  env_prefix: string,
  env_suffix: string,
): bigint | undefined {
  const value = Deno.env.get(`${env_prefix}_ADDRESS_${env_suffix}`);
  if (value !== undefined) return as_bigint(value);
}
/**
 * @returns prefix associated with the given env-address
 */
export function prefix_by(
  env_address: bigint,
): string | undefined {
  const item = Object.entries(Deno.env.toObject())
    .filter(([k]) => k.match(/_ADDRESS$|_ADDRESS_(v[0-9]+[a-z])$/))
    .find(([_, v]) => as_bigint(v) === env_address);
  if (item !== undefined) {
    const parts = item[0].split("_");
    if (parts.length > 0) {
      return parts[0];
    }
  }
}
/**
 * @returns suffix associated with the given env-address
 */
export function suffix_by(
  env_address: bigint,
): string | undefined {
  const item = Object.entries(Deno.env.toObject())
    .filter(([k]) => k.match(/_ADDRESS$|_ADDRESS_(v[0-9]+[a-z])$/))
    .find(([_, v]) => as_bigint(v) === env_address);
  if (item !== undefined) {
    const parts = item[0].split("_");
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
  }
}
