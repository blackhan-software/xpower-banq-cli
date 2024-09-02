import { ethers } from "ethers";

/**
 * A failed provider sits out for 1 minute before becoming eligible again.
 */
const COOLDOWN_MS = 60_000;
/**
 * Exponential backoff between full passes over the provider ring.
 */
const BASE_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 30_000;
/**
 * How many complete passes over `urls` a single `send()` will make before
 * giving up. Each pass cools every provider, then waits and clears cooldowns.
 */
const MAX_CYCLES = 5;
/**
 * How long a provider that cannot serve `eth_getLogs` (range/response-size
 * limits) is skipped for log queries. Long enough to outlast a scan burst.
 */
const LOG_INCAPABLE_MS = 10 * 60_000;

/**
 * Minimal surface the pool needs from a provider. ethers'
 * `JsonRpcProvider`/`WebSocketProvider` satisfy this structurally; tests inject
 * fakes.
 */
export type PooledProvider = {
  send(method: string, params: unknown[]): Promise<unknown>;
  on(event: string, cb: (...args: unknown[]) => void): unknown;
  destroy?(): void;
};

/**
 * Creates a provider for a URL. Defaults to the ethers HTTP/WS constructors;
 * overridable for tests.
 */
export type ProviderFactory = (url: string) => PooledProvider;

/**
 * Pool tuning knobs; every field defaults to the module constant. Tests inject
 * small values to stay fast.
 */
export type ProviderPoolOptions = {
  cooldown_ms?: number;
  base_backoff_ms?: number;
  max_backoff_ms?: number;
  max_cycles?: number;
  log_incapable_ms?: number;
  /** Fixed starting index (default: random). */
  start_index?: number;
};

/**
 * Multi-provider pool with sticky affinity, health tracking and automatic
 * failover.
 *
 * Strategy:
 * - At startup, randomly picks one of the given endpoints.
 * - Sticks to that provider for all subsequent RPC calls.
 * - On failure, cools the provider down (60s) and rotates to the next eligible
 *   URL (circular). Providers that reject `eth_getLogs` (range/size limits) are
 *   additionally excluded from log queries for a longer period.
 * - When every provider is cooled down, waits with exponential backoff +
 *   jitter (honoring `Retry-After` when present), clears cooldowns and retries.
 * - `send()` makes up to `MAX_CYCLES` full passes before throwing the last
 *   error.
 * - The pool lazily creates ethers providers, caching them by index so that a
 *   rotated-to provider reuses its existing connection.
 * - Callbacks registered via `on()` are stored and applied to every provider,
 *   including ones created later during rotation.
 * - `destroy()` is re-entrant safe.
 */
export class ProviderPool {
  /** Ordered list of RPC endpoint URLs, used as the rotation ring. */
  readonly urls: string[];

  /** Lazily-created providers, keyed by index into `urls`. */
  private readonly providers: Map<number, PooledProvider> = new Map();
  /** Index into `urls` of the currently active provider. */
  private current_index: number;
  /** Index → cooldown expiry timestamp; a cooled URL is skipped. */
  private readonly cooldowns: Map<number, number> = new Map();
  /** Index → expiry; provider cannot serve `eth_getLogs` until then. */
  private readonly log_incapable: Map<number, number> = new Map();
  /** Event callbacks applied to every provider (past and future). */
  private readonly pending_callbacks: Map<
    /* event */ string,
    Set<(...args: unknown[]) => void>
  > = new Map();
  /** Original `send` per provider, captured before any patch. */
  private readonly senders: Map<
    number,
    (method: string, params: unknown[]) => Promise<unknown>
  > = new Map();
  /** Original `on` per provider, captured before any patch. */
  private readonly oners: Map<
    number,
    (event: string, cb: (...args: unknown[]) => void) => unknown
  > = new Map();
  /** Provider constructor, overridable for tests. */
  private readonly factory: ProviderFactory;
  private readonly cooldown_ms: number;
  private readonly base_backoff_ms: number;
  private readonly max_backoff_ms: number;
  private readonly max_cycles: number;
  private readonly log_incapable_ms: number;

  /**
   * @param urls — list of RPC endpoints (http/https/ws/wss)
   * @param factory — provider constructor (defaults to ethers)
   * @param options — tuning knobs (defaults to module constants)
   */
  constructor(
    urls: string[],
    factory: ProviderFactory = defaultProviderFactory,
    options: ProviderPoolOptions = {},
  ) {
    this.factory = factory;
    this.cooldown_ms = options.cooldown_ms ?? COOLDOWN_MS;
    this.base_backoff_ms = options.base_backoff_ms ?? BASE_BACKOFF_MS;
    this.max_backoff_ms = options.max_backoff_ms ?? MAX_BACKOFF_MS;
    this.max_cycles = options.max_cycles ?? MAX_CYCLES;
    this.log_incapable_ms = options.log_incapable_ms ?? LOG_INCAPABLE_MS;
    this.current_index = options.start_index ??
      Math.floor(Math.random() * urls.length);
    this.urls = urls;
  }

  /**
   * @returns the currently active (lazy-created) provider.
   */
  active(): PooledProvider {
    return this.getOrCreateProvider(this.current_index);
  }

  /**
   * Advance to the next eligible endpoint (circular). If none is eligible,
   * advance one step regardless — `send()` clears cooldowns after a full pass.
   */
  rotate(): void {
    const next = this.eligible_start();
    this.current_index = next ?? (this.current_index + 1) % this.urls.length;
  }

  /**
   * Issue a JSON-RPC call through the active provider. On failure the provider
   * is cooled down, the next eligible one is tried, and after every endpoint
   * has failed the pool backs off (honoring `Retry-After`) and retries, up to
   * `MAX_CYCLES` passes.
   *
   * @throws the last error when the retry budget is exhausted.
   */
  async send(
    method: string,
    params: unknown[],
  ): Promise<unknown> {
    let last_error: unknown;
    for (let cycle = 0; cycle < this.max_cycles; cycle++) {
      const start = this.eligible_start(method);
      if (start === undefined) {
        // every provider is cooled down — wait, then re-arm the ring
        await sleep(this.retry_delay(cycle, last_error));
        this.cooldowns.clear();
        this.log_incapable.clear();
        continue;
      }
      this.current_index = start;
      for (let i = 0; i < this.urls.length; i++) {
        const index = this.current_index;
        this.getOrCreateProvider(index);
        try {
          const send = this.senders.get(index)!;
          return await send(method, params);
        } catch (e) {
          last_error = e;
          this.penalize(index, method, e);
          console.error(
            `RPC failure [${this.urls[index]}]: ${message_of(e)}`,
          );
          this.current_index = (index + 1) % this.urls.length;
        }
      }
      // full pass failed — back off before re-arming the ring
      await sleep(this.retry_delay(cycle, last_error));
      this.cooldowns.clear();
      this.log_incapable.clear();
    }
    throw last_error ?? new Error("RPC providers exhausted");
  }

  /**
   * @returns every (lazy) created provider — used to attach `on("error")`.
   */
  allProviders(): PooledProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Register a callback for a provider event (e.g. `"error"`).
   * The callback is applied immediately to all cached providers and will be
   * applied to any future providers created during rotation.
   */
  on(event: string, cb: (...args: unknown[]) => void): void {
    if (!this.pending_callbacks.has(event)) {
      this.pending_callbacks.set(event, new Set());
    }
    this.pending_callbacks.get(event)!.add(cb);
    for (const [index, p] of this.providers) {
      // use the captured original `on`: a wrapped provider (pk-wallet patches
      // `primary.on` to delegate here) would otherwise recurse forever
      const register = this.oners.get(index) ?? p.on.bind(p);
      register(event, cb);
    }
  }

  /**
   * Destroy all cached providers. Snapshot-then-clear prevents infinite
   * recursion when a provider's patched `destroy()` delegates back here.
   */
  destroy(): void {
    const entries = this.providers.size > 0
      ? Array.from(this.providers.values())
      : [];
    this.providers.clear();
    this.pending_callbacks.clear();
    for (const p of entries) {
      p.destroy?.();
    }
  }

  /**
   * @returns the first eligible index from `current_index`, or undefined when
   * every provider is cooled down.
   */
  private eligible_start(
    method?: string,
  ): number | undefined {
    const now = Date.now();
    for (let i = 0; i < this.urls.length; i++) {
      const index = (this.current_index + i) % this.urls.length;
      if (this.cooled(index, now)) continue;
      if (method === "eth_getLogs" && this.log_cooled(index, now)) continue;
      return index;
    }
    return undefined;
  }

  private cooled(index: number, now: number): boolean {
    const until = this.cooldowns.get(index);
    return until !== undefined && now < until;
  }

  private log_cooled(index: number, now: number): boolean {
    const until = this.log_incapable.get(index);
    return until !== undefined && now < until;
  }

  private penalize(index: number, method: string, e: unknown): void {
    this.cooldowns.set(index, Date.now() + this.cooldown_ms);
    if (method === "eth_getLogs" && is_log_unsupported(e)) {
      this.log_incapable.set(index, Date.now() + this.log_incapable_ms);
    }
  }

  /**
   * @returns delay before the next full pass: exponential backoff + jitter,
   * widened by `Retry-After` when the last error carried one.
   */
  private retry_delay(cycle: number, e: unknown): number {
    const backoff = Math.min(
      this.max_backoff_ms,
      this.base_backoff_ms * 2 ** cycle,
    );
    const retry_after = retry_after_ms(e, this.max_backoff_ms);
    const base = retry_after !== undefined
      ? Math.max(retry_after, backoff)
      : backoff;
    return base + Math.floor(Math.random() * 250);
  }

  private getOrCreateProvider(index: number): PooledProvider {
    let provider = this.providers.get(index);
    if (!provider) {
      const url = this.urls[index];
      provider = this.factory(url);
      this.providers.set(index, provider);
      this.senders.set(index, provider.send.bind(provider));
      this.oners.set(index, provider.on.bind(provider));
      for (const [event, cbs] of this.pending_callbacks) {
        for (const cb of cbs) provider.on(event, cb);
      }
    }
    return provider;
  }
}

/**
 * Default provider constructor: WebSocket when the URL is `ws(s)://`,
 * otherwise HTTP JSON-RPC.
 */
function defaultProviderFactory(url: string): PooledProvider {
  return /wss?:\/\//i.test(url)
    ? new ethers.WebSocketProvider(url, undefined, { staticNetwork: true })
    : new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true });
}

/**
 * Convenience: create a single ethers provider (WebSocket or JSON-RPC) from a URL.
 */
export function createProviderFromUrl(url: string): ethers.JsonRpcApiProvider {
  return /wss?:\/\//i.test(url)
    ? new ethers.WebSocketProvider(url, undefined, { staticNetwork: true })
    : new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true });
}

type ErrorInfo = {
  responseStatus?: string | number;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
};

function error_info(e: unknown): ErrorInfo | undefined {
  const boxed = e as {
    info?: ErrorInfo;
    error?: { info?: ErrorInfo };
  };
  return boxed?.info ?? boxed?.error?.info;
}

/**
 * @returns the `Retry-After` delay in ms (numeric seconds or HTTP-date), if any.
 */
function retry_after_ms(e: unknown, cap: number): number | undefined {
  const headers = error_info(e)?.responseHeaders;
  const raw = headers?.["retry-after"] ?? headers?.["Retry-After"];
  if (raw !== undefined) {
    const seconds = Number(raw);
    if (Number.isFinite(seconds)) {
      return Math.min(seconds * 1000, cap * 4);
    }
    const date = Date.parse(raw);
    if (!Number.isNaN(date)) {
      return Math.max(0, date - Date.now());
    }
  }
  const status = String(error_info(e)?.responseStatus ?? "");
  if (/429|too many requests/i.test(status)) {
    return 2_000;
  }
  return undefined;
}

/**
 * @returns true when the error indicates the provider cannot serve a log range
 * (unsupported method, range/size limits).
 */
function is_log_unsupported(e: unknown): boolean {
  const info = error_info(e);
  const text = `${message_of(e)} ${info?.responseBody ?? ""}`;
  return /range|not supported|maximum allowed|log response size|block span/i
    .test(text);
}

function message_of(e: unknown): string {
  if (e instanceof Error) {
    const match = e.message.match(/"message":\s*"([^"]+)"/);
    if (!match) {
      return e.message.replace(/\s*\(.*$/, "");
    }
    return match[1];
  }
  return String(e);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
