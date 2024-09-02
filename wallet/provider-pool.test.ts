import { assertEquals, assertRejects } from "@std/assert";
import { type PooledProvider, ProviderPool } from "./provider-pool.ts";

type Fake = {
  provider: PooledProvider;
  calls: () => number;
};

/**
 * Build a fake provider whose `send` runs `impl`, counting invocations.
 */
function fake(
  impl: (method: string, params: unknown[], call: number) => unknown,
): Fake {
  let calls = 0;
  const provider: PooledProvider = {
    send: (method, params) => {
      calls += 1;
      try {
        return Promise.resolve(impl(method, params, calls));
      } catch (e) {
        return Promise.reject(e);
      }
    },
    on: () => provider,
  };
  return { provider, calls: () => calls };
}

function error_with(message: string, info?: Record<string, unknown>): Error {
  const e = new Error(message) as Error & { info?: unknown };
  if (info !== undefined) e.info = info;
  return e;
}

/** Always fails with a plain 5xx-style error. */
function down(): Fake {
  return fake(() => {
    throw error_with("boom", { responseStatus: "500" });
  });
}

Deno.test("provider-pool: fails over to a healthy endpoint", async () => {
  const bad = down();
  const good = fake(() => "ok");
  const pool = new ProviderPool(
    ["a", "b"],
    (url) => (url === "a" ? bad.provider : good.provider),
    {
      start_index: 0,
      cooldown_ms: 10_000,
      base_backoff_ms: 1,
      max_backoff_ms: 2,
      max_cycles: 1,
    },
  );
  assertEquals(await pool.send("eth_blockNumber", []), "ok");
  assertEquals(bad.calls(), 1);
  assertEquals(good.calls(), 1);
});

Deno.test("provider-pool: skips a cooled provider on the next call", async () => {
  const bad = down();
  const good = fake(() => "ok");
  const pool = new ProviderPool(
    ["a", "b"],
    (url) => (url === "a" ? bad.provider : good.provider),
    {
      start_index: 0,
      cooldown_ms: 10_000,
      base_backoff_ms: 1,
      max_backoff_ms: 2,
      max_cycles: 1,
    },
  );
  await pool.send("eth_blockNumber", []);
  await pool.send("eth_blockNumber", []);
  assertEquals(bad.calls(), 1); // only the first call tried "a"
  assertEquals(good.calls(), 2);
});

Deno.test("provider-pool: retries full cycles then throws last error", async () => {
  const a = down();
  const b = down();
  const pool = new ProviderPool(
    ["a", "b"],
    (url) => (url === "a" ? a.provider : b.provider),
    {
      start_index: 0,
      cooldown_ms: 1,
      base_backoff_ms: 1,
      max_backoff_ms: 2,
      max_cycles: 2,
    },
  );
  await assertRejects(
    () => pool.send("eth_blockNumber", []),
    Error,
    "boom",
  );
  // 2 providers × 2 cycles
  assertEquals(a.calls(), 2);
  assertEquals(b.calls(), 2);
});

Deno.test("provider-pool: marks getLogs-incapable provider and skips it", async () => {
  const no_logs = fake((method) => {
    if (method === "eth_getLogs") {
      throw error_with(
        '{"message":"ranges over 10000 blocks are not supported on free plan"}',
      );
    }
    return "simple";
  });
  const good = fake(() => "logs");
  const pool = new ProviderPool(
    ["a", "b"],
    (url) => (url === "a" ? no_logs.provider : good.provider),
    {
      start_index: 0,
      cooldown_ms: 1,
      log_incapable_ms: 10_000,
      base_backoff_ms: 1,
      max_backoff_ms: 2,
      max_cycles: 1,
    },
  );
  assertEquals(await pool.send("eth_getLogs", []), "logs");
  assertEquals(no_logs.calls(), 1);
  // second log query skips "a" entirely (log_incapable), even after cooldown
  assertEquals(await pool.send("eth_getLogs", []), "logs");
  assertEquals(no_logs.calls(), 1);
  assertEquals(good.calls(), 2);
});

Deno.test("provider-pool: log-incapability does not block simple calls", async () => {
  const no_logs = fake((method) => {
    if (method === "eth_getLogs") {
      throw error_with('{"message":"block span exceeds the limit 10000"}');
    }
    return "simple";
  });
  const good = fake((method) => (method === "eth_getLogs" ? "logs" : "good"));
  const pool = new ProviderPool(
    ["a", "b"],
    (url) => (url === "a" ? no_logs.provider : good.provider),
    {
      start_index: 0,
      cooldown_ms: 1,
      log_incapable_ms: 1,
      base_backoff_ms: 1,
      max_backoff_ms: 2,
      max_cycles: 1,
    },
  );
  // "a" serves a simple call before any getLogs failure
  assertEquals(await pool.send("eth_blockNumber", []), "simple");
  assertEquals(no_logs.calls(), 1);
  // getLogs fails on "a" and succeeds on "b"
  assertEquals(await pool.send("eth_getLogs", []), "logs");
  assertEquals(no_logs.calls(), 2);
  // a later simple call still succeeds (log-incapability is method-scoped)
  const result = await pool.send("eth_blockNumber", []);
  assertEquals(result === "simple" || result === "good", true);
});

Deno.test("provider-pool: honors Retry-After when backing off", async () => {
  const a = fake(() => {
    throw error_with("slow down", {
      responseStatus: "429",
      responseHeaders: { "retry-after": "0.05" },
    });
  });
  const pool = new ProviderPool(
    ["a"],
    () => a.provider,
    {
      start_index: 0,
      cooldown_ms: 1,
      base_backoff_ms: 1,
      max_backoff_ms: 2,
      max_cycles: 2,
    },
  );
  const start = Date.now();
  await assertRejects(
    () => pool.send("eth_blockNumber", []),
    Error,
    "slow down",
  );
  // one backoff of >= 50ms between cycles
  assertEquals(Date.now() - start >= 40, true);
});

Deno.test("provider-pool: a patched provider.on does not recurse", () => {
  const events: string[] = [];
  const provider: PooledProvider = {
    send: () => Promise.resolve(null),
    on: (event) => {
      events.push(event);
      return provider;
    },
  };
  const pool = new ProviderPool(["a"], () => provider, { start_index: 0 });
  // mimic pk-wallet: the returned primary delegates `on` back to the pool
  const primary = pool.active() as unknown as {
    on: (event: string, cb: (...args: unknown[]) => void) => unknown;
  };
  primary.on = (event, cb) => {
    pool.on(event, cb);
    return primary;
  };
  // would stack-overflow without the captured-original `on`
  primary.on("error", () => {});
  assertEquals(events, ["error"]);
});
