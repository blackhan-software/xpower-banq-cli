import type { AcmaCacheData, AcmaEvent, AcmaEventJson } from "./acma-types.ts";

/**
 * Returns the cache directory path.
 */
function cache_dir(): string {
  const xdg = Deno.env.get("XDG_CACHE_HOME");
  if (xdg) {
    return `${xdg}/banq-cli/acma`;
  }
  const local = Deno.env.get("LOCALAPPDATA");
  if (local) {
    return `${local}/banq-cli/acma`;
  }
  const home = Deno.env.get("HOME") ?? ".";
  return `${home}/.cache/banq-cli/acma`;
}

/**
 * Returns the cache file path for a given chain and contract.
 */
function cache_path(chain_id: number, acma_address: string): string {
  return `${cache_dir()}/${chain_id}-${acma_address}.json`;
}

/**
 * Load cached events, or null if no cache exists.
 */
export function load_cache(
  chain_id: number,
  acma_address: string,
): AcmaCacheData | null {
  const path = cache_path(chain_id, acma_address);
  try {
    const text = Deno.readTextFileSync(path);
    const data = JSON.parse(text) as AcmaCacheData;
    if (data.chainId !== chain_id || data.acma !== acma_address) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Save events to cache atomically.
 */
export function save_cache(
  chain_id: number,
  acma_address: string,
  from_block: number,
  to_block: number,
  events: AcmaEvent[],
): void {
  const dir = cache_dir();
  try {
    Deno.mkdirSync(dir, { recursive: true });
  } catch {
    // directory may already exist
  }
  const data: AcmaCacheData = {
    chainId: chain_id,
    acma: acma_address,
    fromBlock: from_block,
    toBlock: to_block,
    events: events.map(event_to_json),
  };
  const path = cache_path(chain_id, acma_address);
  const tmp = `${path}.tmp.${Date.now()}`;
  Deno.writeTextFileSync(tmp, JSON.stringify(data, null, 2));
  Deno.renameSync(tmp, path);
}

/**
 * Convert cached JSON events back to AcmaEvent[].
 */
export function events_from_cache(data: AcmaCacheData): AcmaEvent[] {
  return data.events.map(json_to_event);
}

function event_to_json(ev: AcmaEvent): AcmaEventJson {
  return {
    block: ev.block,
    logIndex: ev.logIndex,
    txHash: ev.txHash,
    kind: ev.kind,
    ...(ev.roleId !== undefined && { roleId: ev.roleId.toString() }),
    ...(ev.account !== undefined && { account: ev.account.toString() }),
    ...(ev.delay !== undefined && { delay: ev.delay }),
    ...(ev.since !== undefined && { since: ev.since }),
    ...(ev.newMember !== undefined && { newMember: ev.newMember }),
    ...(ev.label !== undefined && { label: ev.label }),
    ...(ev.admin !== undefined && { admin: ev.admin.toString() }),
    ...(ev.guardian !== undefined && { guardian: ev.guardian.toString() }),
    ...(ev.target !== undefined && { target: ev.target.toString() }),
    ...(ev.selector !== undefined && { selector: ev.selector }),
    ...(ev.closed !== undefined && { closed: ev.closed }),
    ...(ev.operationId !== undefined && { operationId: ev.operationId }),
    ...(ev.nonce !== undefined && { nonce: ev.nonce }),
    ...(ev.schedule !== undefined && { schedule: ev.schedule }),
    ...(ev.caller !== undefined && { caller: ev.caller.toString() }),
    ...(ev.data !== undefined && { data: ev.data }),
  };
}

function json_to_event(json: AcmaEventJson): AcmaEvent {
  return {
    block: json.block,
    logIndex: json.logIndex,
    txHash: json.txHash,
    kind: json.kind,
    ...(json.roleId !== undefined && { roleId: BigInt(json.roleId) }),
    ...(json.account !== undefined && { account: BigInt(json.account) }),
    ...(json.delay !== undefined && { delay: json.delay }),
    ...(json.since !== undefined && { since: json.since }),
    ...(json.newMember !== undefined && { newMember: json.newMember }),
    ...(json.label !== undefined && { label: json.label }),
    ...(json.admin !== undefined && { admin: BigInt(json.admin) }),
    ...(json.guardian !== undefined && { guardian: BigInt(json.guardian) }),
    ...(json.target !== undefined && { target: BigInt(json.target) }),
    ...(json.selector !== undefined && { selector: json.selector }),
    ...(json.closed !== undefined && { closed: json.closed }),
    ...(json.operationId !== undefined && {
      operationId: json.operationId,
    }),
    ...(json.nonce !== undefined && { nonce: json.nonce }),
    ...(json.schedule !== undefined && { schedule: json.schedule }),
    ...(json.caller !== undefined && { caller: BigInt(json.caller) }),
    ...(json.data !== undefined && { data: json.data }),
  };
}
