import { assertEquals, assertThrows } from "@std/assert";
import { opt_provider_url } from "./opt-provider-url.ts";
import { ArgumentError } from "./types.ts";

const OPTS = { permissions: { env: true } };

Deno.test("opt_provider_url [valid]", OPTS, () => {
  const url = opt_provider_url({
    provider_url: "https://api.avax.network/ext/bc/C/rpc",
  });
  assertEquals(url, "https://api.avax.network/ext/bc/C/rpc");
});
Deno.test("opt_provider_url [invalid] throws", OPTS, () => {
  assertThrows(
    () => opt_provider_url({ provider_url: "not-a-url" }),
    ArgumentError,
  );
});
Deno.test("opt_provider_url [] env fallback", OPTS, () => {
  // PROVIDER_URL is set via --env flags in test
  const url = opt_provider_url();
  assertEquals(typeof url, "string");
});
