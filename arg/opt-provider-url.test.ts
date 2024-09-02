import { assertEquals, assertThrows } from "@std/assert";
import { opt_provider_urls, parseProviderUrls } from "./opt-provider-url.ts";
import { ArgumentError } from "./types.ts";

const OPTS = { permissions: { env: true } };

Deno.test("opt_provider_urls [single url]", OPTS, () => {
  const urls = opt_provider_urls({
    provider_url: "https://api.avax.network/ext/bc/C/rpc",
  });
  assertEquals(urls, ["https://api.avax.network/ext/bc/C/rpc"]);
});

Deno.test("opt_provider_urls [comma separated]", OPTS, () => {
  const urls = opt_provider_urls({
    provider_url:
      "https://api.avax.network/ext/bc/C/rpc,https://avalanche-c-chain-rpc.publicnode.com",
  });
  assertEquals(urls, [
    "https://api.avax.network/ext/bc/C/rpc",
    "https://avalanche-c-chain-rpc.publicnode.com/",
  ]);
});

Deno.test("opt_provider_urls [url normalization]", OPTS, () => {
  const urls = opt_provider_urls({
    provider_url:
      "  https://api.avax.network/ext/bc/C/rpc ,   https://avalanche-c-chain-rpc.publicnode.com  ",
  });
  assertEquals(urls, [
    "https://api.avax.network/ext/bc/C/rpc",
    "https://avalanche-c-chain-rpc.publicnode.com/",
  ]);
});

Deno.test("opt_provider_urls [env fallback]", OPTS, () => {
  const urls = opt_provider_urls();
  assertEquals(Array.isArray(urls), true);
  assertEquals(urls.length > 0, true);
});

Deno.test("opt_provider_urls [no env] throws", OPTS, () => {
  const saved = Deno.env.get("PROVIDER_URL");
  Deno.env.delete("PROVIDER_URL");
  try {
    assertThrows(
      () => opt_provider_urls(),
      ArgumentError,
      "missing PROVIDER_URL",
    );
  } finally {
    if (saved) Deno.env.set("PROVIDER_URL", saved);
  }
});

Deno.test("parseProviderUrls [trailing comma]", () => {
  const urls = parseProviderUrls(
    "https://rpc.ankr.com/avalanche,https://avalanche.drpc.org,",
  );
  assertEquals(urls, [
    "https://rpc.ankr.com/avalanche",
    "https://avalanche.drpc.org/",
  ]);
});

Deno.test("parseProviderUrls [invalid] throws", () => {
  assertThrows(
    () => parseProviderUrls("not-a-url"),
    ArgumentError,
    "invalid provider-url",
  );
});

Deno.test("parseProviderUrls [empty after split] throws", () => {
  assertThrows(
    () => parseProviderUrls(","),
    ArgumentError,
    "no valid provider URLs",
  );
});

Deno.test("parseProviderUrls [single ws url]", () => {
  const urls = parseProviderUrls("wss://api.avax.network/ext/bc/C/ws");
  assertEquals(urls, ["wss://api.avax.network/ext/bc/C/ws"]);
});

Deno.test("parseProviderUrls [mixed http and ws]", () => {
  const urls = parseProviderUrls(
    "wss://avalanche.drpc.org,https://avalanche.drpc.org",
  );
  assertEquals(urls, [
    "wss://avalanche.drpc.org/",
    "https://avalanche.drpc.org/",
  ]);
});
