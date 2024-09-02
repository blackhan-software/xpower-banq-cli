import { ethers } from "ethers";

/**
 * 60s cooldown: a failed provider sits out for 1 minute before becoming eligible again.
 */
const COOLDOWN_MS = 60_000;

/**
 * Multi-provider pool with sticky affinity and automatic failover.
 *
 * Strategy:
 * - At startup, randomly picks one of the given endpoints.
 * - Sticks to that provider for all subsequent RPC calls.
 * - On any error, marks the current provider as unhealthy (60s cooldown)
 *   and rotates to the next URL in the list (circular).
 * - The pool lazily creates ethers providers, caching them by index so
 *   that a rotated-to provider reuses its existing connection.
 * - Callbacks registered via `on()` are stored and applied to every
 *   provider, including ones created later during rotation.
 * - `destroy()` is re-entrant safe: it snapshots the provider map before
 *   clearing it, then destroys each snapshot entry.
 */
export class ProviderPool {
  /** Ordered list of RPC endpoint URLs, used as the rotation ring. */
  readonly urls: string[];

  /** Lazily-created ethers providers, keyed by index into `urls`. */
  private readonly providers: Map<number, ethers.JsonRpcApiProvider> =
    new Map();
  /** Index into `urls` of the currently active provider. */
  private current_index: number;
  /** Index → timestamp; a cooldown URL is skipped by `rotate()`. */
  private readonly cooldowns: Map<number, number> = new Map();
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

  /**
   * @param urls — list of RPC endpoints (http/https/ws/wss)
   */
  constructor(urls: string[]) {
    this.current_index = Math.floor(Math.random() * urls.length);
    this.urls = urls;
  }

  /**
   * @returns the currently active (lazy-created) ethers provider.
   */
  active(): ethers.JsonRpcApiProvider {
    return this.getOrCreateProvider(this.current_index);
  }

  /**
   * Mark the current provider as unhealthy and switch to the next healthy
   * endpoint in the list. If every endpoint is in cooldown, clear all
   * cooldowns and pick a random fallback.
   */
  rotate(): void {
    this.cooldowns.set(
      this.current_index,
      Date.now() + COOLDOWN_MS,
    );
    for (let i = 1; i <= this.urls.length; i++) {
      const next = (this.current_index + i) % this.urls.length;
      const cooldown = this.cooldowns.get(next);
      if (!cooldown || Date.now() > cooldown) {
        this.current_index = next;
        return;
      }
    }
    this.cooldowns.clear();
    this.current_index = Math.floor(
      Math.random() * this.urls.length,
    );
  }

  /**
   * Issue a JSON-RPC call through the active provider, retrying on
   * failure by rotating through all URLs up to once each.
   * @throws when every provider has been tried and all have failed.
   */
  async send(
    method: string,
    params: unknown[],
  ): Promise<unknown> {
    for (let i = 0; i < this.urls.length; i++) {
      try {
        this.active(); // ensures provider + sender exist for current_index
        const send = this.senders.get(this.current_index)!;
        return await send(method, params);
      } catch (e) {
        if (i === this.urls.length - 1) {
          throw e;
        }
        console.error(
          `RPC failure [${this.urls[this.current_index]}]: ${message_of(e)}`,
        );
        this.rotate();
      }
    }
    throw new Error("RPC providers exhausted");
  }

  /**
   * @returns every (lazy) created provider — used to attach `on("error")` listeners.
   */
  allProviders(): ethers.JsonRpcApiProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Register a callback for a provider event (e.g. `"error"`).
   * The callback is applied immediately to all cached providers
   * and will be applied to any future providers created during rotation.
   */
  on(event: string, cb: (...args: unknown[]) => void): void {
    if (!this.pending_callbacks.has(event)) {
      this.pending_callbacks.set(event, new Set());
    }
    this.pending_callbacks.get(event)!.add(cb);
    for (const p of this.providers.values()) {
      p.on(event, cb);
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

  private getOrCreateProvider(index: number): ethers.JsonRpcApiProvider {
    let provider = this.providers.get(index);
    if (!provider) {
      const url = this.urls[index];
      provider = /wss?:\/\//i.test(url)
        ? new ethers.WebSocketProvider(url, undefined, { staticNetwork: true })
        : new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true });
      this.providers.set(index, provider);
      const proto = ethers.JsonRpcApiProvider.prototype;
      this.senders.set(index, (m, p) => proto.send.call(provider, m, p));
      for (const [, cbs] of this.pending_callbacks) {
        for (const cb of cbs) provider.on("error", cb);
      }
    }
    return provider;
  }
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

/**
 * Convenience: create a single ethers provider (WebSocket or JSON-RPC) from a URL.
 */
export function createProviderFromUrl(url: string): ethers.JsonRpcApiProvider {
  return /wss?:\/\//i.test(url)
    ? new ethers.WebSocketProvider(url, undefined, { staticNetwork: true })
    : new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true });
}
