import { assert } from "../function/assert.ts";
import { ethers } from "ethers";

import { opt_hd_path } from "../arg/opt-hd-path.ts";
import { opt_provider_url } from "../arg/opt-provider-url.ts";
import { LedgerSigner } from "./hw-ledger-signer.ts";

export type SignerOptions = Partial<{
  provider_url: string;
  hd_path: string;
}>;

export type SignerAccount = {
  signer: ethers.Signer;
  account: string;
};

/**
 * @returns a signer-wallet and its account-address
 */
export async function wallet(
  options?: SignerOptions,
): Promise<SignerAccount> {
  const url = opt_provider_url(options);
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
  const provider = new ethers.JsonRpcProvider(url);
  const signer = new LedgerSigner(HID, provider, path);
  const account = await signer.getAddress();
  assert(account, "missing signer-account");
  ///
  return { signer, account };
}
