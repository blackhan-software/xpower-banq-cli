import { opt_private_key } from "../arg/opt-private-key.ts";
import { opt_provider_url } from "../arg/opt-provider-url.ts";

import { assert } from "../function/assert.ts";
import { ethers } from "ethers";

export type SignerOptions = Partial<{
  provider_url: string;
  private_key: string;
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
  const pk = opt_private_key(options);
  ///
  /// construct signer-account
  ///
  const provider = new ethers.JsonRpcProvider(url);
  const wallet = new ethers.Wallet(pk, provider);
  const account = await wallet.getAddress();
  assert(account, "missing signer-account");
  ///
  return { signer: wallet, account };
}
