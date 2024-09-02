import { opt_private_key } from "../arg/opt-private-key.ts";
import { opt_provider_urls } from "../arg/opt-provider-url.ts";
import { createProviderFromUrl, ProviderPool } from "./provider-pool.ts";

import { assert } from "../function/assert.ts";
import { ethers } from "ethers";

import type { SignerAccount } from "./types.ts";
export type { SignerAccount } from "./types.ts";

export type SignerOptions = Partial<{
  provider_url: string;
  private_key: string;
}>;

/**
 * @returns a signer-wallet and its account-address
 */
export async function wallet(
  options?: SignerOptions,
): Promise<SignerAccount> {
  const urls = opt_provider_urls(options);
  const pk = opt_private_key(options);
  ///
  /// construct signer-account
  ///
  const provider = urls.length === 1
    ? createSingleProvider(urls[0])
    : createMultiProvider(urls);
  const wallet = new ethers.Wallet(pk, provider);
  const account = await wallet.getAddress();
  assert(account, "missing signer-account");
  ///
  return { signer: wallet, account };
}

function createSingleProvider(url: string): ethers.AbstractProvider {
  const p = createProviderFromUrl(url);
  if (p instanceof ethers.WebSocketProvider) {
    globalThis.addEventListener("unload", () => p.destroy());
  }
  return p;
}

function createMultiProvider(urls: string[]): ethers.AbstractProvider {
  const pool = new ProviderPool(urls);
  const primary = pool.active() as unknown as Record<string, unknown>;

  primary.send = async (method: string, params: unknown[]) => {
    return await pool.send(method, params);
  };

  primary.destroy = () => {
    pool.destroy();
  };

  primary.on = (event: string, cb: (...args: unknown[]) => void) => {
    pool.on(event, cb);
    return primary;
  };

  globalThis.addEventListener("unload", () => pool.destroy());
  return primary as unknown as ethers.AbstractProvider;
}
