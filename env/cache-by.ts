import { as_bigint } from "../function/as-bigint.ts";

const CACHE: Map<bigint, string> = new Map();
/**
 * @returns a map of env-address to env-key for matching regex
 */
export function cache_by(regex: RegExp): ReadonlyMap<bigint, string> {
  if (!CACHE.size) {
    for (const [k, v] of Object.entries(Deno.env.toObject())) {
      if (k.match(regex)) {
        const addr = as_bigint(v);
        if (addr !== undefined) {
          CACHE.set(addr, k);
        }
      }
    }
  }
  return CACHE;
}
/**
 * Clears the env-address cache, allowing re-population on next access.
 */
export function cache_clear(): void {
  CACHE.clear();
}
/**
 * @returns manager to retrieve and clear the env-address cache
 */
export default { by: cache_by, clear: cache_clear };
