import type { SignerOptions as HWSignerOptions } from "./hw-ledger-wallet.ts";
import type { SignerOptions as PKSignerOptions } from "./pk-wallet.ts";
import { wallet as ledger_hw } from "./hw-ledger-wallet.ts";
import { wallet as pk_wallet } from "./pk-wallet.ts";
import { ethers } from "ethers";

export type SignerOptions<
  T extends boolean,
> = T extends true ? HWSignerOptions : PKSignerOptions;

export type SignerAccount = {
  signer: ethers.Signer;
  account: string;
};

/**
 * @dev https://docs.ethers.org/v6/api/wallet/#Wallet
 *
 * @param options for the signer-wallet
 * @param with_pk flag to ensure a private-key (random if none)
 * @returns a signer-wallet and its account-address
 */
export function wallet<T extends boolean>(
  options: SignerOptions<T> & { ledger?: T },
  with_pk?: boolean,
): Promise<SignerAccount> {
  if (options.ledger) return ledger_hw(options);
  return pk_wallet(extend(options, with_pk));
}
function extend(
  options: PKSignerOptions,
  with_pk?: boolean,
) {
  if (!options.private_key && with_pk) {
    const key = new ethers.SigningKey(
      ethers.randomBytes(32),
    );
    options.private_key = key.privateKey;
  }
  return options;
}
