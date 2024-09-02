import { assert } from "../function/assert.ts";
import { ethers } from "ethers";

import { opt_hd_path } from "../arg/opt-hd-path.ts";
import { opt_provider_urls } from "../arg/opt-provider-url.ts";
import { ProviderPool } from "./provider-pool.ts";
import { LedgerSigner } from "./hw-ledger-signer.ts";

import type { SignerAccount } from "./types.ts";
export type { SignerAccount } from "./types.ts";

export type SignerOptions = Partial<{
  provider_url: string;
  hd_path: string;
}>;

/**
 * @returns a signer-wallet and its account-address
 */
export async function wallet(
  options?: SignerOptions,
): Promise<SignerAccount> {
  const urls = opt_provider_urls(options);
  const path = opt_hd_path(options);
  ///
  /// import @ledgerhq/hw-transport-{*} dynamically
  ///
  const { default: HID } = await import(
    "@ledgerhq/hw-transport-node-hid"
  );
  ///
  /// construct signer-account
  ///
  const provider = urls.length === 1
    ? new ethers.JsonRpcProvider(urls[0])
    : createLedgerMultiProvider(urls);
  const signer = new LedgerSigner(HID, provider, path);
  const account = await signer.getAddress();
  assert(account, "missing signer-account");
  ///
  return { signer, account };
}

function createLedgerMultiProvider(urls: string[]): ethers.AbstractProvider {
  const pool = new ProviderPool(urls);
  const primary = pool.active() as unknown as Record<string, unknown>;

  primary.send = async (method: string, params: unknown[]) => {
    return await pool.send(method, params);
  };

  primary.destroy = () => {
    pool.destroy();
  };

  return primary as unknown as ethers.AbstractProvider;
}
