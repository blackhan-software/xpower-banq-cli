import { as_bigint } from "../function/as-bigint.ts";
import { registry_reverse } from "./registry-reverse.ts";

const CACHE: Map<bigint, string> = new Map();
/**
 * @returns a map of env-address to env-key for matching regex, merged with
 * the active discovery-registry reverse map (address -> name).
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
  const merged = new Map(CACHE);
  for (const [addr, name] of registry_reverse()) {
    merged.set(addr, name);
  }
  return merged;
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
