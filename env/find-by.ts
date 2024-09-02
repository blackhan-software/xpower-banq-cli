import "@std/dotenv/load";
import { as_bigint } from "../tool/as-bigint.ts";

/**
 * @returns address associated with the given env-prefix
 */
export function address_by(env_prefix: string): bigint | undefined {
  const value = Deno.env.get(`${env_prefix}_ADDRESS`);
  if (value !== undefined) return as_bigint(value);
}
/**
 * @returns prefix associated with the given env-address
 */
export function prefix_by(env_address: bigint): string | undefined {
  const item = Object.entries(Deno.env.toObject())
    .filter(([k]) => k.endsWith("_ADDRESS"))
    .find(([_, v]) => as_bigint(v) === env_address);
  if (item !== undefined) {
    const prefix_rest = item[0].split("_");
    if (prefix_rest.length > 0) {
      return prefix_rest[0];
    }
  }
}
