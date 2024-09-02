/**
 * Active reverse-lookup registry (address -> name).
 *
 * Populated by `env/registry.ts` `discover()` and consumed by
 * `env/cache-by.ts` for offline reverse lookups (`prefix_by`). The registry
 * merges discovered token symbols, oracle names, pool names, CAPS, ACMA and
 * `.env.contacts` labels, so display paths can resolve a label for any
 * known address without re-reading the environment.
 */
let REVERSE: ReadonlyMap<bigint, string> = new Map();

/**
 * @returns the currently active reverse-lookup map (address -> name).
 */
export function registry_reverse(): ReadonlyMap<bigint, string> {
  return REVERSE;
}
/**
 * Replace the active reverse-lookup map (used by `discover()` and tests).
 */
export function set_registry_reverse(
  map: ReadonlyMap<bigint, string>,
): void {
  REVERSE = map;
}
