import { assertEquals, assertRejects } from "@std/assert";
import type { ethers } from "ethers";
import { ArgumentError } from "../../arg/types.ts";
import { wallet } from "../../wallet/index.ts";
import { ANVIL_AVAILABLE, startAnvil } from "../anvil.ts";

const OPTS = {
  permissions: { env: true, net: true, run: true },
  sanitizeOps: false,
  sanitizeResources: false,
};
const KNOWN_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const KNOWN_ADDR = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

/**
 * @group wallet — valid private key
 */
Deno.test("wallet: valid key returns expected account", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    const { account } = await wallet({
      private_key: KNOWN_KEY,
      provider_url: anvil.url,
    });
    assertEquals(account, KNOWN_ADDR);
  } finally {
    anvil.stop();
  }
});

/**
 * @group wallet — random key
 */
Deno.test("wallet: random key returns valid signer", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    const { signer, account } = await wallet({
      provider_url: anvil.url,
    } as { provider_url: string; private_key: string }, true);
    assertEquals(typeof account, "string");
    assertEquals(account.length, 42);
    assertEquals(typeof signer.getAddress, "function");
  } finally {
    anvil.stop();
  }
});

/**
 * @group wallet — HTTP provider
 */
Deno.test("wallet: HTTP provider works", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  try {
    const { signer, account } = await wallet({
      private_key: KNOWN_KEY,
      provider_url: anvil.url,
    });
    assertEquals(account, KNOWN_ADDR);
    const addr = await signer.getAddress();
    assertEquals(addr, KNOWN_ADDR);
  } finally {
    anvil.stop();
  }
});

/**
 * @group wallet — WebSocket provider
 */
Deno.test("wallet: WebSocket provider works", {
  ...OPTS,
  ignore: !ANVIL_AVAILABLE,
}, async () => {
  const anvil = await startAnvil();
  const wsUrl = anvil.url.replace("http://", "ws://");
  try {
    const { signer, account } = await wallet({
      private_key: KNOWN_KEY,
      provider_url: wsUrl,
    });
    assertEquals(account, KNOWN_ADDR);
    const addr = await signer.getAddress();
    assertEquals(addr, KNOWN_ADDR);
    // Force WS handshake to complete, then clean up
    const provider = signer.provider as ethers.WebSocketProvider;
    await provider.getBlockNumber();
    await provider.destroy();
  } finally {
    anvil.stop();
  }
});

/**
 * @group wallet — invalid key
 */
Deno.test("wallet: invalid private key throws ArgumentError", OPTS, () => {
  assertRejects(
    () =>
      wallet({
        private_key: "not-a-key",
        provider_url: "http://127.0.0.1:8545",
      }),
    ArgumentError,
    "invalid private-key",
  );
});
